import React, { useState } from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import { message } from 'antd';
import Card from 'antd/lib/card';
import Typography from 'antd/lib/typography';
import Alert from 'antd/lib/alert';
import Space from 'antd/lib/space';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Empty from 'antd/lib/empty';
import Tooltip from 'antd/lib/tooltip';
import { 
  AppstoreOutlined,
  ApiOutlined,
  CopyOutlined,
  DownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import './DesignSystemPage.css';

const { Title, Paragraph, Text } = Typography;

const DesignSystemPage: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/design-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaLibraryId: values.figmaLibraryId })
      });
      if (!res.ok) throw new Error('生成失败');
      const data = await res.json();
      setResult(data);
      message.success('设计规范生成成功');
    } catch (err: any) {
      message.error(err.message || '生成设计规范失败');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('设计规范已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const downloadSpec = (spec: string, filename: string) => {
    const blob = new Blob([spec], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('设计规范下载成功');
  };

  return (
    <div className="design-system-page" style={{ padding: 24 }}>
      <div className="page-header">
        <Title level={2}>
          <AppstoreOutlined /> 设计规范系统
        </Title>
        <Paragraph type="secondary">
          通过Figma组件库ID生成完整的设计系统规范，包括颜色、字体、组件等设计元素
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ApiOutlined />
                Figma组件库配置
              </Space>
            }
            className="config-card"
          >
            <Alert
              message="使用说明"
              description={
                <div>
                  <p>1. 打开你的Figma设计文件</p>
                  <p>2. 从URL中复制文件ID（通常是一串字母数字组合）</p>
                  <p>3. 粘贴到下方输入框中，点击生成</p>
                </div>
              }
              type="info"
              showIcon
              className="usage-guide"
            />
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
            >
              <Form.Item 
                name="figmaLibraryId" 
                label="Figma组件库ID"
                rules={[
                  { required: true, message: '请输入Figma组件库ID' },
                  { min: 10, message: 'ID长度至少10个字符' }
                ]}
              > 
                <Input 
                  placeholder="例如: abc123def456..." 
                  disabled={loading}
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
                  生成设计规范
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          {result ? (
            <Card 
              title="设计规范结果"
              className="result-card"
              extra={
                <Space>
                  <Tooltip title="复制规范">
                    <Button 
                      size="small"
                      onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    >
                      <CopyOutlined />
                    </Button>
                  </Tooltip>
                  <Tooltip title="下载规范">
                    <Button 
                      size="small"
                      onClick={() => downloadSpec(
                        JSON.stringify(result, null, 2), 
                        `design-system-${Date.now()}.json`
                      )}
                    >
                      <DownloadOutlined />
                    </Button>
                  </Tooltip>
                </Space>
              }
            >
              <div className="spec-info">
                <Space direction="vertical" size="small">
                  <Text strong>生成信息：</Text>
                  <Text type="secondary">
                    Figma库ID: {form.getFieldValue('figmaLibraryId')}
                  </Text>
                  <Text type="secondary">
                    生成时间: {new Date().toLocaleString()}
                  </Text>
                </Space>
              </div>
              
              <div className="result-container">
                <pre className="spec-preview">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </Card>
          ) : (
            <Card className="placeholder-card">
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="输入Figma组件库ID后生成设计规范"
                imageStyle={{ height: 60 }}
              >
                <Space direction="vertical" align="center">
                  <Text type="secondary">支持的设计元素：</Text>
                  <Space wrap>
                    <Text code>颜色</Text>
                    <Text code>字体</Text>
                    <Text code>组件</Text>
                    <Text code>样式</Text>
                  </Space>
                </Space>
              </Empty>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default DesignSystemPage;