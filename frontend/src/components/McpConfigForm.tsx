import React, { useEffect, useState } from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Button from 'antd/lib/button';
import message from 'antd/lib/message';
import Card from 'antd/lib/card';
import InputNumber from 'antd/lib/input-number';
import Collapse from 'antd/lib/collapse';

// 定义MCP配置类型
interface McpConfig {
  id: string;
  name: string;
  type: 'FigmaMCP' | 'CursorMCP';
  apiKey: string;
  cursorConfig?: {
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    completionDelay?: number;
    maxGenLength?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onSuccess: () => void;
  initial?: Partial<McpConfig>;
  onSubmit?: (data: Partial<McpConfig>) => Promise<void>;
  submitText?: string;
}

const { Option } = Select;
const { Panel } = Collapse;

const McpConfigForm: React.FC<Props> = ({ onSuccess, initial, onSubmit, submitText }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('FigmaMCP');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      name: initial?.name || '',
      type: initial?.type || 'FigmaMCP',
      apiKey: initial?.apiKey || '',
      cursorConfig: initial?.cursorConfig || {
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.9,
        completionDelay: 0.5,
        maxGenLength: 100
      }
    });
    setSelectedType(initial?.type || 'FigmaMCP');
  }, [initial, form]);


  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(values);
        message.success('保存成功');
        onSuccess();
      } else {
        const res = await fetch('/api/mcp-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.msg || '保存失败');
        }
        form.resetFields();
        message.success('新增成功');
        onSuccess();
      }
    } catch (err: any) {
      message.error(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTestLoading(true);
    try {
      const values = await form.validateFields();
      const res = await fetch('/api/mcp-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || '测试失败');
      }
      
      const result = await res.json();
      message.success(result.msg || '连接测试成功');
    } catch (err: any) {
      message.error(err.message || '连接测试失败');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    // 重置 Cursor 配置当切换类型时
    if (value !== 'CursorMCP') {
      form.setFieldsValue({ cursorConfig: undefined });
    }
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginBottom: 16 }}
        initialValues={{ 
          type: 'FigmaMCP',
          cursorConfig: {
            temperature: 0.7,
            maxTokens: 1024,
            topP: 0.9,
            completionDelay: 0.5,
            maxGenLength: 100
          }
        }}
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Form.Item name="name" rules={[{ required: true, message: '请输入配置名称' }]} style={{ flex: 1 }}>
            <Input placeholder="配置名称" disabled={loading} />
          </Form.Item>
          <Form.Item name="type" style={{ width: 120 }}>
            <Select disabled={loading} onChange={handleTypeChange}>
              <Option value="FigmaMCP">FigmaMCP</Option>
              <Option value="CursorMCP">CursorMCP</Option>
            </Select>
          </Form.Item>
          <Form.Item name="apiKey" rules={[{ required: true, message: '请输入API Key' }]} style={{ flex: 2 }}>
            <Input placeholder="API Key" disabled={loading} />
          </Form.Item>
        </div>

        {selectedType === 'CursorMCP' && (
          <Card title="Cursor MCP Plugin 配置" size="small" style={{ marginBottom: 16 }}>
            <Collapse ghost>
              <Panel header="高级配置（可选）" key="1">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Form.Item name={['cursorConfig', 'endpoint']} label="API 端点">
                    <Input placeholder="https://api.cursor.sh/v1" disabled={loading} />
                  </Form.Item>
                  <Form.Item name={['cursorConfig', 'model']} label="模型名称">
                    <Input placeholder="cursor-small" disabled={loading} />
                  </Form.Item>
                  <Form.Item 
                    name={['cursorConfig', 'temperature']} 
                    label="Temperature (0.01-1)"
                    rules={[{ type: 'number', min: 0.01, max: 1, message: '请输入0.01-1之间的数值' }]}
                  >
                    <InputNumber 
                      min={0.01} 
                      max={1} 
                      step={0.1} 
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item 
                    name={['cursorConfig', 'maxTokens']} 
                    label="Max Tokens (1-4096)"
                    rules={[{ type: 'number', min: 1, max: 4096, message: '请输入1-4096之间的数值' }]}
                  >
                    <InputNumber 
                      min={1} 
                      max={4096} 
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item 
                    name={['cursorConfig', 'topP']} 
                    label="Top P (0-1)"
                    rules={[{ type: 'number', min: 0, max: 1, message: '请输入0-1之间的数值' }]}
                  >
                    <InputNumber 
                      min={0} 
                      max={1} 
                      step={0.1} 
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item 
                    name={['cursorConfig', 'completionDelay']} 
                    label="完成延迟 (0-5秒)"
                    rules={[{ type: 'number', min: 0, max: 5, message: '请输入0-5之间的数值' }]}
                  >
                    <InputNumber 
                      min={0} 
                      max={5} 
                      step={0.1} 
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item 
                    name={['cursorConfig', 'maxGenLength']} 
                    label="最大生成长度 (1-1000)"
                    rules={[{ type: 'number', min: 1, max: 1000, message: '请输入1-1000之间的数值' }]}
                  >
                    <InputNumber 
                      min={1} 
                      max={1000} 
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              </Panel>
            </Collapse>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            {submitText || '新增配置'}
          </Button>
          <Button onClick={handleTest} loading={testLoading} disabled={loading}>
            测试连接
          </Button>
        </div>
      </Form>
    </div>
  );

};

export default McpConfigForm; 