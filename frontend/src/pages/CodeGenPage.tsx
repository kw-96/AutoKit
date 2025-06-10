import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Card from 'antd/lib/card';
import Tabs from 'antd/lib/tabs';
import Space from 'antd/lib/space';
import Typography from 'antd/lib/typography';
import Alert from 'antd/lib/alert';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Spin from 'antd/lib/spin';
import Empty from 'antd/lib/empty';
import Tooltip from 'antd/lib/tooltip';
import { 
  CodeOutlined, 
  ThunderboltOutlined, 
  FileOutlined,
  CopyOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import './CodeGenPage.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface MCPConfig {
  id: string;
  name: string;
  enabled: boolean;
}

const CodeGenPage: React.FC = () => {
  const [codeForm] = Form.useForm();
  const [designForm] = Form.useForm();
  const [componentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [designSpec, setDesignSpec] = useState<string>('');
  const [componentResult, setComponentResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    fetchMcpConfigs();
  }, []);

  const fetchMcpConfigs = async () => {
    setConfigsLoading(true);
    try {
      // 模拟API调用
      setTimeout(() => {
        setMcpConfigs([
          { id: '1', name: 'Default MCP', enabled: true }
        ]);
        setConfigsLoading(false);
      }, 1000);
    } catch (error) {
      message.error('获取MCP配置失败');
      setConfigsLoading(false);
    }
  };

  const handleMCPCodeGenerate = async (values: any) => {
    setLoading(true);
    try {
      // 模拟代码生成
      setTimeout(() => {
        setGeneratedCode(`// Generated ${values.language} code\nfunction example() {\n  console.log("Hello World");\n}`);
        setLoading(false);
        message.success('代码生成成功');
      }, 2000);
    } catch (error) {
      message.error('代码生成失败');
      setLoading(false);
    }
  };

  const handleMCPDesignSpecGenerate = async (values: any) => {
    setLoading(true);
    try {
      // 模拟设计规范生成
      setTimeout(() => {
        setDesignSpec(`Design Specification:\n${values.designDescription}\n\nGenerated at: ${new Date().toISOString()}`);
        setLoading(false);
        message.success('设计规范生成成功');
      }, 2000);
    } catch (error) {
      message.error('设计规范生成失败');
      setLoading(false);
    }
  };

  const handleGenerateComponent = async (values: any) => {
    setLoading(true);
    try {
      // 模拟组件代码生成
      setTimeout(() => {
        setComponentResult({
          success: true,
          data: {
            framework: values.framework,
            code: `// ${values.framework === 'react' ? 'React' : 'Vue'} Component\nconst ${values.componentName} = () => {\n  return <div>Hello ${values.componentName}</div>;\n};`
          }
        });
        setLoading(false);
        message.success('组件代码生成成功');
      }, 2000);
    } catch (error) {
      message.error('组件代码生成失败');
      setLoading(false);
    }
  };

  // 复制代码到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('代码已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 下载代码文件
  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('文件下载成功');
  };

  return (
    <div className="code-gen-page">
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        type="card"
      >
        <TabPane 
          key="1"
          tab={
            <span>
              <ThunderboltOutlined />
              Cursor MCP 代码生成
            </span>
          }
        >
          <div className="tab-content">
            <Row gutter={[24, 24]}>
              <Col span="24">
                <Alert
                  message="提示"
                  description="使用Cursor MCP进行AI驱动的代码生成，需要先配置MCP连接。"
                  type="info"
                  showIcon
                  closable
                />
                <div style={{ marginBottom: 24 }}></div>
                <Button 
                  size="small"
                  onClick={fetchMcpConfigs}
                  loading={configsLoading}
                >
                  <ReloadOutlined />
                  刷新配置
                </Button>
              </Col>
            </Row>
            
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <CodeOutlined />
                      AI 代码生成
                    </Space>
                  } 
                  className="code-gen-card"
                  extra={
                    mcpConfigs.length > 0 && (
                      <Text type="secondary">
                        {mcpConfigs.length} 个配置可用
                      </Text>
                    )
                  }
                >
                  <Spin spinning={configsLoading}>
                    <Form 
                      form={codeForm} 
                      layout="vertical" 
                      onFinish={handleMCPCodeGenerate}
                      initialValues={{ language: "typescript" }}
                    >
                      <Form.Item 
                        name="mcpConfigId" 
                        label="选择 MCP 配置" 
                        rules={[{ required: true, message: '请选择MCP配置' }]}
                      >
                        <Select 
                          placeholder="请选择配置"
                          loading={configsLoading}
                        >
                          {mcpConfigs.map(config => (
                            <Option key={config.id} value={config.id}>
                              <Space>
                                <span>{config.name}</span>
                                {config.enabled ? (
                                  <Text type="secondary" style={{ fontSize: 12 }}>已启用</Text>
                                ) : (
                                  <Text type="secondary" style={{ fontSize: 12 }}>未启用</Text>
                                )}
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item 
                        name="language" 
                        label="编程语言"
                      >
                        <Select>
                          <Option value="typescript">TypeScript</Option>
                          <Option value="javascript">JavaScript</Option>
                          <Option value="python">Python</Option>
                          <Option value="java">Java</Option>
                          <Option value="go">Go</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item 
                        name="prompt" 
                        label="代码需求描述" 
                        rules={[{ required: true, message: '请输入代码需求描述' }]}
                      >
                        <TextArea 
                          rows={6} 
                          placeholder="详细描述你需要的代码功能..." 
                        />
                      </Form.Item>
                      
                      <Form.Item>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          loading={loading}
                          disabled={mcpConfigs.length === 0}
                          size="large"
                        >
                          <ThunderboltOutlined />
                          生成代码
                        </Button>
                      </Form.Item>
                    </Form>
                  </Spin>
                </Card>
              </Col>
              
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <FileOutlined />
                      设计规范生成
                    </Space>
                  } 
                  className="code-gen-card"
                >
                  <Spin spinning={configsLoading}>
                    <Form form={designForm} layout="vertical" onFinish={handleMCPDesignSpecGenerate}>
                      <Form.Item 
                        name="mcpConfigId" 
                        label="选择 MCP 配置" 
                        rules={[{ required: true, message: '请选择MCP配置' }]}
                      >
                        <Select 
                          placeholder="请选择配置"
                          loading={configsLoading}
                        >
                          {mcpConfigs.map(config => (
                            <Option key={config.id} value={config.id}>
                              <Space>
                                <span>{config.name}</span>
                                {config.enabled ? (
                                  <Text type="secondary" style={{ fontSize: 12 }}>已启用</Text>
                                ) : (
                                  <Text type="secondary" style={{ fontSize: 12 }}>未启用</Text>
                                )}
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item 
                        name="designDescription" 
                        label="设计需求描述" 
                        rules={[{ required: true, message: '请输入设计需求描述' }]}
                      >
                        <TextArea 
                          rows={6} 
                          placeholder="详细描述你的设计需求..." 
                        />
                      </Form.Item>
                      
                      <Form.Item>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          loading={loading}
                          disabled={mcpConfigs.length === 0}
                          size="large"
                        >
                          <FileOutlined />
                          生成设计规范
                        </Button>
                      </Form.Item>
                    </Form>
                  </Spin>
                </Card>
              </Col>
            </Row>
            
            {/* 生成结果展示 */}
            {(generatedCode || designSpec) && (
              <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                {generatedCode && (
                  <Col xs={24} lg={12}>
                    <Card 
                      title="生成的代码" 
                      className="result-card"
                      extra={
                        <Space>
                          <Tooltip title="复制代码">
                            <Button 
                              size="small"
                              onClick={() => copyToClipboard(generatedCode)}
                            >
                              <CopyOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip title="下载代码">
                            <Button 
                              size="small"
                              onClick={() => downloadCode(generatedCode, 'generated-code.txt')}
                            >
                              <DownloadOutlined />
                            </Button>
                          </Tooltip>
                        </Space>
                      }
                    >
                      <pre className="code-preview">
                        {generatedCode}
                      </pre>
                    </Card>
                  </Col>
                )}
                
                {designSpec && (
                  <Col xs={24} lg={12}>
                    <Card 
                      title="生成的设计规范" 
                      className="result-card"
                      extra={
                        <Space>
                          <Tooltip title="复制规范">
                            <Button 
                              size="small"
                              onClick={() => copyToClipboard(designSpec)}
                            >
                              <CopyOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip title="下载规范">
                            <Button 
                              size="small"
                              onClick={() => downloadCode(designSpec, 'design-spec.txt')}
                            >
                              <DownloadOutlined />
                            </Button>
                          </Tooltip>
                        </Space>
                      }
                    >
                      <pre className="code-preview">
                        {designSpec}
                      </pre>
                    </Card>
                  </Col>
                )}
              </Row>
            )}
          </div>
        </TabPane>
        
        <TabPane 
          key="2"
          tab={
            <span>
              <CodeOutlined />
              简单组件生成
            </span>
          }
        >
          <div className="tab-content">
            <Row gutter={[24, 24]}>
              <Col span="24">
                <Alert
                  message="简单组件生成"
                  description="快速生成基础前端组件代码，适用于简单的UI组件创建。"
                  type="info"
                  showIcon
                />
                <div style={{ marginBottom: 24 }}></div>
              </Col>
            </Row>
            
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card title="前端组件代码生成" className="code-gen-card">
                  <Form
                    form={componentForm}
                    layout="vertical"
                    onFinish={handleGenerateComponent}
                    initialValues={{ framework: 'react' }}
                  >
                    <Form.Item 
                      name="componentName" 
                      label="组件名" 
                      rules={[
                        { required: true, message: '请输入组件名' },
                        { pattern: /^[A-Z][a-zA-Z0-9]*$/, message: '组件名应使用PascalCase命名法' }
                      ]}
                    >
                      <Input 
                        placeholder="例如: MyButton" 
                        disabled={loading}
                      />
                    </Form.Item>
                    
                    <Form.Item 
                      name="props" 
                      label="Props（可选）"
                    >
                      <Input 
                        placeholder="逗号分隔，例如: label,type,size" 
                        disabled={loading}
                      />
                    </Form.Item>
                    
                    <Form.Item 
                      name="framework" 
                      label="框架"
                    >
                      <Select disabled={loading}>
                        <Option value="react">React</Option>
                        <Option value="vue">Vue</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        size="large"
                      >
                        <CodeOutlined />
                        生成组件代码
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              
              <Col xs={24} lg={12}>
                {componentResult && componentResult.success ? (
                  <Card 
                    title="生成的组件代码" 
                    className="result-card"
                    extra={
                      <Space>
                        <Text type="secondary">
                          框架：{componentResult.data.framework}
                        </Text>
                        <Tooltip title="复制代码">
                          <Button 
                            size="small"
                            onClick={() => copyToClipboard(componentResult.data.code)}
                          >
                            <CopyOutlined />
                          </Button>
                        </Tooltip>
                        <Tooltip title="下载代码">
                          <Button 
                            size="small"
                            onClick={() => downloadCode(
                              componentResult.data.code, 
                              `${componentForm.getFieldValue('componentName') || 'Component'}.${componentResult.data.framework === 'react' ? 'tsx' : 'vue'}`
                            )}
                          >
                            <DownloadOutlined />
                          </Button>
                        </Tooltip>
                      </Space>
                    }
                  >
                    <pre className="code-preview">
                      {componentResult.data.code}
                    </pre>
                  </Card>
                ) : (
                  <Card className="placeholder-card">
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="生成组件后将在此处显示代码"
                    />
                  </Card>
                )}
              </Col>
            </Row>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CodeGenPage;