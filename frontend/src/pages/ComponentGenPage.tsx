import React, { useState } from 'react';
import { Form, Input, Select, Button, message } from 'antd';

const ComponentGenPage: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Button');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('生成失败');
      setResult(await res.json());
      setSuccess('生成成功');
      message.success('生成成功');
    } catch (err: any) {
      setError(err.message || '生成失败');
      message.error(err.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>组件生成</h2>
      <Form
        form={form}
        layout="inline"
        onFinish={handleFinish}
        style={{ marginBottom: 16 }}
        initialValues={{ type: 'Button' }}
      >
        <Form.Item name="name" rules={[{ required: true, message: '请输入组件名称' }]}> 
          <Input placeholder="组件名称" disabled={loading} />
        </Form.Item>
        <Form.Item name="type">
          <Select style={{ width: 120 }} disabled={loading}>
            <Select.Option value="Button">Button</Select.Option>
            <Select.Option value="Input">Input</Select.Option>
            <Select.Option value="Alert">Alert</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="description">
          <Input placeholder="描述" disabled={loading} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            生成组件
          </Button>
        </Form.Item>
      </Form>
      {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
      {success && <span style={{ color: 'green', marginLeft: 8 }}>{success}</span>}
      {result && (
        <pre style={{ background: '#f6f6f6', padding: 12 }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
};

export default ComponentGenPage; 