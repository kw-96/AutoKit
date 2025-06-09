import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';

const DesignSystemPage: React.FC = () => {
  const [figmaLibraryId, setFigmaLibraryId] = useState('');
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
      const res = await fetch('/api/design-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaLibraryId: values.figmaLibraryId })
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
      <h2>设计规范系统</h2>
      <Form
        form={form}
        layout="inline"
        onFinish={handleFinish}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="figmaLibraryId" rules={[{ required: true, message: '请输入Figma组件库ID' }]}> 
          <Input placeholder="Figma组件库ID" disabled={loading} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            生成设计规范
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

export default DesignSystemPage; 