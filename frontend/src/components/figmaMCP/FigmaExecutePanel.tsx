import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Divider, Collapse, Alert, Spin, Space } from 'antd';
import { CodeOutlined, LinkOutlined, FileOutlined, AppstoreOutlined } from '@ant-design/icons';
import './FigmaExecutePanel.css';

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

interface FigmaExecutePanelProps {
  onExecute: (action: string, payload: any) => Promise<any>;
  onJoinChannel: (channelId: string) => Promise<any>;
  loading: boolean;
  disabled: boolean;
}

const FigmaExecutePanel: React.FC<FigmaExecutePanelProps> = ({ 
  onExecute, 
  onJoinChannel,
  loading,
  disabled
}) => {
  const [action, setAction] = useState<string>('');
  const [payload, setPayload] = useState<string>('{}');
  const [channelId, setChannelId] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 处理执行操作
  const handleExecute = async () => {
    try {
      setError(null);
      setResult(null);
      
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        setError('Payload 格式错误，请检查 JSON 格式');
        return;
      }
      
      const result = await onExecute(action, parsedPayload);
      setResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : '执行操作失败');
    }
  };

  // 处理加入通道
  const handleJoinChannel = async () => {
    try {
      setError(null);
      setResult(null);
      
      if (!channelId) {
        setError('请输入通道ID');
        return;
      }
      
      const result = await onJoinChannel(channelId);
      setResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : '加入通道失败');
    }
  };

  // 常用操作列表
  const commonActions = [
    { 
      title: '获取文档信息', 
      action: 'get_document_info',
      payload: {},
      icon: <FileOutlined />
    },
    { 
      title: '获取当前选择', 
      action: 'get_selection',
      payload: {},
      icon: <AppstoreOutlined />
    },
    { 
      title: '获取样式', 
      action: 'get_styles',
      payload: {},
      icon: <CodeOutlined />
    },
    { 
      title: '获取本地组件', 
      action: 'get_local_components',
      payload: {},
      icon: <AppstoreOutlined />
    }
  ];

  // 处理选择常用操作
  const handleSelectCommonAction = (actionObj: any) => {
    setAction(actionObj.action);
    setPayload(JSON.stringify(actionObj.payload, null, 2));
  };

  return (
    <div className="figma-execute-panel">
      <Card title="连接Figma" className="figma-card">
        <Form layout="vertical">
          <Form.Item label="通道ID">
            <Input
              placeholder="输入通道ID"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              disabled={loading || disabled}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              onClick={handleJoinChannel}
              loading={loading}
              disabled={disabled}
              icon={<LinkOutlined />}
            >
              加入通道
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="执行Figma操作" className="figma-card">
        <Form layout="vertical">
          <Form.Item label="操作">
            <Input
              placeholder="输入操作名称"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              disabled={loading || disabled}
            />
          </Form.Item>
          <Form.Item label="参数 (JSON格式)">
            <TextArea
              placeholder="输入操作参数 (JSON格式)"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={6}
              disabled={loading || disabled}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              onClick={handleExecute}
              loading={loading}
              disabled={!action || disabled}
              icon={<CodeOutlined />}
            >
              执行操作
            </Button>
          </Form.Item>
        </Form>

        <Divider>常用操作</Divider>

        <div className="common-actions">
          <Space wrap>
            {commonActions.map((item) => (
              <Button
                key={item.action}
                onClick={() => handleSelectCommonAction(item)}
                disabled={loading || disabled}
                icon={item.icon}
              >
                {item.title}
              </Button>
            ))}
          </Space>
        </div>
      </Card>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          className="result-alert"
        />
      )}

      {loading && (
        <div className="loading-container">
          <Spin tip="执行中..." />
        </div>
      )}

      {result && (
        <Card title="执行结果" className="result-card">
          <Collapse defaultActiveKey={['1']}>
            <Panel header="结果数据" key="1">
              <pre className="result-json">
                {JSON.stringify(result, null, 2)}
              </pre>
            </Panel>
          </Collapse>
        </Card>
      )}
    </div>
  );
};

export default FigmaExecutePanel; 