import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Tabs } from 'antd';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface McpConfig {
  id: string;
  name: string;
  type: string;
}

const CodeGenPage: React.FC = () => {
  const [codeForm] = Form.useForm();
  const [designForm] = Form.useForm();
  const [componentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mcpConfigs, setMcpConfigs] = useState<McpConfig[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [designSpec, setDesignSpec] = useState<string>('');
  const [componentResult, setComponentResult] = useState<any>(null);

  useEffect(() => {
    fetchMcpConfigs();
  }, []);

  const fetchMcpConfigs = async () => {
    try {
      const response = await fetch('/api/mcp-config');
      const result = await response.json();
      if (result.code === 0) {
        // 只显示 Cursor MCP配置
        setMcpConfigs(result.data.filter((config: McpConfig) => config.type === 'CursorMCP'));
      }
    } catch (error) {
      message.error('获取MCP配置失败');
    }
  };

  const handleGenerateCode = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/code/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const result = await response.json();
      if (result.code === 0) {
        setGeneratedCode(result.data.generatedCode);
        message.success('代码生成成功');
      } else {
        message.error(result.msg || '代码生成失败');
      }
    } catch (error) {
      message.error('代码生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDesignSpec = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/code/design-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const result = await response.json();
      if (result.code === 0) {
        setDesignSpec(result.data.designSpec);
        message.success('设计规范生成成功');
      } else {
        message.error(result.msg || '设计规范生成失败');
      }
    } catch (error) {
      message.error('设计规范生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComponent = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: values.componentName,
          props: values.props ? values.props.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          framework: values.framework
        })
      });
      
      if (!response.ok) throw new Error('生成失败');
      const result = await response.json();
      setComponentResult(result);
      message.success('组件生成成功');
    } catch (error: any) {
      message.error(error.message || '组件生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>代码生成工具</h1>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="Cursor MCP 代码生成" key="1">
          <Card title="AI 代码生成" style={{ marginBottom: 24 }}>
            <Form form={codeForm} layout="vertical" onFinish={handleGenerateCode}>
              <Form.Item name="mcpConfigId" label="选择 Cursor MCP 配置" rules={[{ required: true }]}>
                <Select placeholder="请选择配置">
                  {mcpConfigs.map(config => (
                    <Option key={config.id} value={config.id}>{config.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="language" label="编程语言" initialValue="typescript">
                <Select>
                  <Option value="typescript">TypeScript</Option>
                  <Option value="javascript">JavaScript</Option>
                  <Option value="python">Python</Option>
                  <Option value="java">Java</Option>
                  <Option value="go">Go</Option>
                </Select>
              </Form.Item>
              <Form.Item name="prompt" label="代码需求描述" rules={[{ required: true }]}>
                <TextArea rows={4} placeholder="描述你需要生成的代码功能..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成代码
              </Button>
            </Form>
            
            {generatedCode && (
              <Card title="生成的代码" style={{ marginTop: 16 }}>
                <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
                  {generatedCode}
                </pre>
              </Card>
            )}
          </Card>

          <Card title="设计规范生成">
            <Form form={designForm} layout="vertical" onFinish={handleGenerateDesignSpec}>
              <Form.Item name="mcpConfigId" label="选择 Cursor MCP 配置" rules={[{ required: true }]}>
                <Select placeholder="请选择配置">
                  {mcpConfigs.map(config => (
                    <Option key={config.id} value={config.id}>{config.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="designDescription" label="设计需求描述" rules={[{ required: true }]}>
                <TextArea rows={4} placeholder="描述你的设计需求..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成设计规范
              </Button>
            </Form>
            
            {designSpec && (
              <Card title="生成的设计规范" style={{ marginTop: 16 }}>
                <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
                  {designSpec}
                </pre>
              </Card>
            )}
          </Card>
        </TabPane>

        <TabPane tab="简单组件生成" key="2">
          <Card title="前端组件代码生成">
            <Form
              form={componentForm}
              layout="vertical"
              onFinish={handleGenerateComponent}
              initialValues={{ framework: 'react' }}
            >
              <Form.Item name="componentName" label="组件名" rules={[{ required: true, message: '请输入组件名' }]}>
                <Input placeholder="例如: MyButton" disabled={loading} />
              </Form.Item>
              <Form.Item name="props" label="Props（可选）">
                <Input placeholder="逗号分隔，例如: label,type,size" disabled={loading} />
              </Form.Item>
              <Form.Item name="framework" label="框架">
                <Select disabled={loading}>
                  <Option value="react">React</Option>
                  <Option value="vue">Vue</Option>
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成组件代码
              </Button>
            </Form>
            
            {componentResult && componentResult.success && (
              <Card title="生成的组件代码" style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>框架：</strong>{componentResult.data.framework}
                </div>
                <pre style={{ background: '#222', color: '#fff', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
                  {componentResult.data.code}
                </pre>
              </Card>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CodeGenPage;