import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';

const DesignGenPage: React.FC = () => {
  const [pageName, setPageName] = useState('');
  const [description, setDescription] = useState('');
  const [components, setComponents] = useState('');
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
      const res = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageName: values.pageName,
          description: values.description,
          components: values.components.split(',').map((s: string) => s.trim()).filter(Boolean)
        })
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
      <h2>设计稿生成</h2>
      <Form
        form={form}
        layout="inline"
        onFinish={handleFinish}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="pageName" rules={[{ required: true, message: '请输入页面名称' }]}> 
          <Input placeholder="页面名称" disabled={loading} />
        </Form.Item>
        <Form.Item name="description">
          <Input placeholder="描述" disabled={loading} />
        </Form.Item>
        <Form.Item name="components">
          <Input placeholder="组件列表（逗号分隔）" disabled={loading} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            生成设计稿
          </Button>
        </Form.Item>
      </Form>
      {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
      {success && <span style={{ color: 'green', marginLeft: 8 }}>{success}</span>}
      {result && (
        <div style={{ background: '#f6f6f6', padding: 12 }}>
          <div>页面名称：{result.pageName}</div>
          <div>描述：{result.description}</div>
          <div>组件：{Array.isArray(result.components) ? result.components.join(', ') : ''}</div>
          <div>Figma链接：<a href={result.figmaUrl} target="_blank" rel="noopener noreferrer">{result.figmaUrl}</a></div>
          <div>预览：<img src={result.preview} alt="设计稿预览" style={{ maxWidth: 300 }} /></div>
        </div>
      )}
    </div>
  );
};

export default DesignGenPage; 