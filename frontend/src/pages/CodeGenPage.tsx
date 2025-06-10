import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import Button from 'antd/es/button';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Card from 'antd/es/card';
import Tabs from 'antd/es/tabs';
import { CursorMCPService } from '../services/cursorMCP/mcpService';
import { MCPConfig } from '../services/cursorMCP/types';
import './CodeGenPage.css';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const CodeGenPage: React.FC = () => {
  const [codeForm] = Form.useForm();
  const [designForm] = Form.useForm();
  const [componentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [designSpec, setDesignSpec] = useState<string>('');
  const [componentResult, setComponentResult] = useState<any>(null);

  useEffect(() => {
    fetchMcpConfigs();
  }, []);

  const fetchMcpConfigs = async () => {
    try {
      const response = await CursorMCPService.getAllConfigs();
      if (response.success && response.data) {
        setMcpConfigs(response.data);
      } else {
        message.error(response.error || '获取MCP配置失败');
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

  // 执行MCP操作
  const executeMCPAction = async (configId: string, action: string, payload: any) => {
    try {
      const response = await CursorMCPService.executeAction(configId, {
        action,
        payload,
        options: {}
      });
      
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '执行MCP操作失败');
    }
  };

  // 使用MCP执行代码生成
  const handleMCPCodeGenerate = async (values: any) => {
    setLoading(true);
    try {
      const { mcpConfigId, prompt, language } = values;
      
      const response = await executeMCPAction(mcpConfigId, 'generate_code', {
        prompt,
        language: language || 'typescript'
      });
      
      if (response.success && response.data) {
        setGeneratedCode(response.data.code || response.data.toString());
        message.success('代码生成成功');
      } else {
        message.error(response.error || '代码生成失败');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '代码生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 使用MCP执行设计规范生成
  const handleMCPDesignSpecGenerate = async (values: any) => {
    setLoading(true);
    try {
      const { mcpConfigId, designDescription } = values;
      
      const response = await executeMCPAction(mcpConfigId, 'generate_design_spec', {
        description: designDescription
      });
      
      if (response.success && response.data) {
        setDesignSpec(response.data.spec || response.data.toString());
        message.success('设计规范生成成功');
      } else {
        message.error(response.error || '设计规范生成失败');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '设计规范生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-gen-page">
      <h1>代码生成工具</h1>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="Cursor MCP 代码生成" key="1">
          <Card title="AI 代码生成" className="code-gen-card">
            <Form 
              form={codeForm} 
              layout="vertical" 
              onFinish={handleMCPCodeGenerate}
              initialValues={{ language: "typescript" }}
            >
              <Form.Item 
                name="mcpConfigId" 
                label="选择 MCP 配置" 
                rules={[{ required: true }]}
                tooltip="选择已配置的Cursor MCP配置"
              >
                <Select placeholder="请选择配置">
                  {mcpConfigs.map(config => (
                    <Option key={config.id} value={config.id}>{config.name}</Option>
                  ))}
                </Select>
                {mcpConfigs.length === 0 && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                    请先在CursorMCP页面添加配置
                  </div>
                )}
              </Form.Item>
              <Form.Item 
                name="language" 
                label="编程语言" 
                initialValue="typescript"
                tooltip="选择要生成的代码语言"
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
                rules={[{ required: true }]}
                tooltip="详细描述你需要的代码功能，越详细越好"
              >
                <TextArea 
                  rows={4} 
                  placeholder="例如：创建一个React组件，用于显示用户资料卡片，包含头像、姓名、邮箱和操作按钮..." 
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成代码
              </Button>
            </Form>
            
            {generatedCode && (
              <Card title="生成的代码" className="result-card">
                <pre className="code-preview">
                  {generatedCode}
                </pre>
              </Card>
            )}
          </Card>

          <Card title="设计规范生成" className="code-gen-card">
            <Form form={designForm} layout="vertical" onFinish={handleMCPDesignSpecGenerate}>
              <Form.Item 
                name="mcpConfigId" 
                label="选择 MCP 配置" 
                rules={[{ required: true }]}
                tooltip="选择已配置的Cursor MCP配置"
              >
                <Select placeholder="请选择配置">
                  {mcpConfigs.map(config => (
                    <Option key={config.id} value={config.id}>{config.name}</Option>
                  ))}
                </Select>
                {mcpConfigs.length === 0 && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                    请先在CursorMCP页面添加配置
                  </div>
                )}
              </Form.Item>
              <Form.Item 
                name="designDescription" 
                label="设计需求描述" 
                rules={[{ required: true }]}
                tooltip="详细描述你的设计需求，包括风格、颜色、组件等"
              >
                <TextArea 
                  rows={4} 
                  placeholder="例如：创建一个现代风格的电商应用设计规范，主色调为蓝色，包含按钮、输入框、卡片等基础组件..." 
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成设计规范
              </Button>
            </Form>
            
            {designSpec && (
              <Card title="生成的设计规范" className="result-card">
                <pre className="code-preview">
                  {designSpec}
                </pre>
              </Card>
            )}
          </Card>
        </TabPane>

        <TabPane tab="简单组件生成" key="2">
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
                rules={[{ required: true, message: '请输入组件名' }]}
                tooltip="组件名应使用PascalCase命名法，如MyButton"
              >
                <Input placeholder="例如: MyButton" disabled={loading} />
              </Form.Item>
              <Form.Item 
                name="props" 
                label="Props（可选）"
                tooltip="组件的属性，多个属性用逗号分隔"
              >
                <Input placeholder="逗号分隔，例如: label,type,size" disabled={loading} />
              </Form.Item>
              <Form.Item 
                name="framework" 
                label="框架"
                tooltip="选择要生成的前端框架"
              >
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
              <Card title="生成的组件代码" className="result-card">
                <div className="framework-info">
                  <strong>框架：</strong>{componentResult.data.framework}
                </div>
                <pre className="code-preview dark">
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