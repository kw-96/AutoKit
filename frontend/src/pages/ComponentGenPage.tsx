import React, { useState } from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Button from 'antd/lib/button';
import { message } from 'antd';
import Card from 'antd/lib/card';
import Typography from 'antd/lib/typography';
import Space from 'antd/lib/space';
import Alert from 'antd/lib/alert';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Empty from 'antd/lib/empty';
import Tooltip from 'antd/lib/tooltip';
import { 
  FileOutlined,
  CopyOutlined,
  DownloadOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ComponentGenPage: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('生成失败');
      const data = await res.json();
      setResult(data);
      message.success('组件生成成功');
    } catch (err: any) {
      message.error(err.message || '组件生成失败');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('代码已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

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
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Title level={2}>
          <AppstoreOutlined /> 组件生成
        </Title>
        <Paragraph type="secondary">
          快速生成前端组件代码，支持多种组件类型和自定义描述
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="组件配置" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Alert
              message="组件命名规范"
              description="请使用PascalCase命名法，如 MyButton、UserCard 等"
              type="info"
              showIcon
            />
            <div style={{ marginBottom: 24 }}></div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              initialValues={{ type: 'Button' }}
            >
              <Form.Item 
                name="name" 
                label="组件名称"
                rules={[
                  { required: true, message: '请输入组件名称' },
                  { pattern: /^[A-Z][a-zA-Z0-9]*$/, message: '请使用PascalCase命名法' }
                ]}
              > 
                <Input 
                  placeholder="例如: MyButton" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item name="type" label="组件类型">
                <Select disabled={loading}>
                  <Option value="Button">Button 按钮</Option>
                  <Option value="Input">Input 输入框</Option>
                  <Option value="Alert">Alert 提示</Option>
                  <Option value="Card">Card 卡片</Option>
                  <Option value="Modal">Modal 模态框</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="description" label="组件描述（可选）">
                <TextArea 
                  placeholder="描述组件的功能和用途..." 
                  disabled={loading}
                  rows={3}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  block
                >
                  生成组件
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          {result ? (
            <Card 
              title="生成结果"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              extra={
                <Space>
                  <Tooltip title="复制代码">
                    <Button 
                      size="small"
                      onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    >
                      <CopyOutlined />
                    </Button>
                  </Tooltip>
                  <Tooltip title="下载文件">
                    <Button 
                      size="small"
                      onClick={() => downloadCode(
                        JSON.stringify(result, null, 2), 
                        `${form.getFieldValue('name') || 'component'}.json`
                      )}
                    >
                      <DownloadOutlined />
                    </Button>
                  </Tooltip>
                </Space>
              }
            >
              <div style={{ marginBottom: 16 }}>
                <Text strong>组件信息：</Text>
                <br />
                <Text type="secondary">名称: {result.name || '未知'}</Text>
                <br />
                <Text type="secondary">类型: {result.type || '未知'}</Text>
              </div>
              <pre style={{ 
                background: '#1e1e1e', 
                color: '#d4d4d4',
                padding: 16, 
                borderRadius: 6,
                fontSize: 13,
                lineHeight: 1.6,
                overflow: 'auto',
                maxHeight: 400
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          ) : (
            <Card style={{ 
              height: 400, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="生成组件后将在此处显示结果"
                imageStyle={{ height: 60 }}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ComponentGenPage;