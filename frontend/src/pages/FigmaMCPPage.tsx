import React, { useState, useEffect } from 'react';
import Card from 'antd/lib/card';
import Button from 'antd/lib/button';
import Tabs from 'antd/lib/tabs';
import message from 'antd/lib/message';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Badge from 'antd/lib/badge';
import Space from 'antd/lib/space';
import Typography from 'antd/lib/typography';
import Tooltip from 'antd/lib/tooltip';
import { 
  ReloadOutlined, 
  AppstoreOutlined, 
  SettingOutlined, 
  CodeOutlined, 
  LinkOutlined
} from '@ant-design/icons';
import FigmaMCPConfigForm from '../components/figmaMCP/FigmaMCPConfigForm';
import FigmaMCPConfigList from '../components/figmaMCP/FigmaMCPConfigList';
import FigmaDesignSpecView from '../components/figmaMCP/FigmaDesignSpecView';
import FigmaExecutePanel from '../components/figmaMCP/FigmaExecutePanel';
import { FigmaMCPService } from '../services/figmaMCP/figmaMcpService';
import { MCPConfig } from '../services/figmaMCP/types';
import './FigmaMCPPage.css';

const { Title, Text } = Typography;

const FigmaMCPPage: React.FC = () => {
  const [configs, setConfigs] = useState<MCPConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<MCPConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('configs');
  const [designSpec, setDesignSpec] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  // 加载配置
  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await FigmaMCPService.getConfigs();
      if (response.success) {
        setConfigs(response.data || []);
      } else {
        message.error(`加载配置失败: ${response.error}`);
      }
    } catch (error) {
      message.error(`加载配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadConfigs();
  }, []);

  // 处理配置选择
  const handleConfigSelect = (config: MCPConfig) => {
    setSelectedConfig(config);
  };

  // 处理配置创建
  const handleConfigCreate = async (config: Partial<MCPConfig>) => {
    try {
      setLoading(true);
      const response = await FigmaMCPService.createConfig(config);
      if (response.success) {
        message.success('配置创建成功');
        loadConfigs();
      } else {
        message.error(`配置创建失败: ${response.error}`);
      }
    } catch (error) {
      message.error(`配置创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理配置更新
  const handleConfigUpdate = async (id: string, config: Partial<MCPConfig>) => {
    try {
      setLoading(true);
      const response = await FigmaMCPService.updateConfig(id, config);
      if (response.success) {
        message.success('配置更新成功');
        loadConfigs();
      } else {
        message.error(`配置更新失败: ${response.error}`);
      }
    } catch (error) {
      message.error(`配置更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理配置删除
  const handleConfigDelete = async (id: string) => {
    try {
      setLoading(true);
      const response = await FigmaMCPService.deleteConfig(id);
      if (response.success) {
        message.success('配置删除成功');
        if (selectedConfig?.id === id) {
          setSelectedConfig(null);
        }
        loadConfigs();
      } else {
        message.error(`配置删除失败: ${response.error}`);
      }
    } catch (error) {
      message.error(`配置删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 生成设计规范
  const handleGenerateDesignSpec = async () => {
    if (!selectedConfig) {
      message.info('请先选择一个配置');
      return;
    }

    try {
      setLoading(true);
      const response = await FigmaMCPService.generateDesignSpec(selectedConfig.id);
      if (response.success) {
        setDesignSpec(response.data);
        message.success('设计规范生成成功');
        setActiveTab('design-spec');
      } else {
        message.error(`设计规范生成失败: ${response.error}`);
      }
    } catch (error) {
      message.error(`设计规范生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 执行Figma操作
  const handleExecuteFigmaAction = async (action: string, payload: any) => {
    if (!selectedConfig) {
      message.info('请先选择一个配置');
      return;
    }

    try {
      setLoading(true);
      const response = await FigmaMCPService.executeFigmaAction(selectedConfig.id, action, payload);
      if (response.success) {
        message.success('操作执行成功');
        // 成功执行后设置连接状态为已连接
        setConnectionStatus('connected');
        return response.data;
      } else {
        message.error(`操作执行失败: ${response.error}`);
        setConnectionStatus('error');
        return null;
      }
    } catch (error) {
      message.error(`操作执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setConnectionStatus('error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 加入通道
  const handleJoinChannel = async (channelId: string) => {
    if (!selectedConfig) {
      message.info('请先选择一个配置');
      return;
    }

    try {
      setLoading(true);
      const response = await FigmaMCPService.joinChannel(selectedConfig.id, channelId);
      if (response.success) {
        message.success('已加入通道');
        setConnectionStatus('connected');
        return response.data;
      } else {
        message.error(`加入通道失败: ${response.error}`);
        setConnectionStatus('error');
        return null;
      }
    } catch (error) {
      message.error(`加入通道失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setConnectionStatus('error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 状态指示器
  const getStatusBadge = () => {
    switch(connectionStatus) {
      case 'connected':
        return <div className="ant-badge"><span className="ant-badge-status-dot ant-badge-status-success"></span><span className="ant-badge-status-text">已连接</span></div>;
      case 'error':
        return <div className="ant-badge"><span className="ant-badge-status-dot ant-badge-status-error"></span><span className="ant-badge-status-text">连接失败</span></div>;
      default:
        return <div className="ant-badge"><span className="ant-badge-status-dot ant-badge-status-default"></span><span className="ant-badge-status-text">未连接</span></div>;
    }
  };

  // 定义Tabs的items
  const tabItems = [
    {
      key: 'configs',
      label: '配置管理',
      children: (
        <div className="figma-mcp-content">
          <div className="config-list-container">
            <Card title="配置列表" className="config-list-card">
              <FigmaMCPConfigList 
                configs={configs} 
                loading={loading} 
                onSelect={handleConfigSelect}
                onDelete={handleConfigDelete}
                selectedConfigId={selectedConfig?.id}
              />
            </Card>
          </div>
          <div className="config-form-container">
            <Card 
              title={selectedConfig ? "编辑配置" : "创建配置"} 
              className="config-form-card"
            >
              <FigmaMCPConfigForm 
                config={selectedConfig} 
                loading={loading} 
                onSubmit={selectedConfig ? 
                  (config) => handleConfigUpdate(selectedConfig.id, config) : 
                  handleConfigCreate
                }
              />
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'design-spec',
      label: '设计规范',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="design-spec-toolbar">
              <Space>
                <Button 
                  type="primary" 
                  icon={<AppstoreOutlined />}
                  onClick={handleGenerateDesignSpec} 
                  loading={loading}
                  disabled={!selectedConfig}
                >
                  生成设计规范
                </Button>
                {designSpec && (
                  <Button 
                    icon={<CodeOutlined />} 
                    onClick={() => {/* 导出设计令牌功能 */}} 
                    disabled={!designSpec}
                  >
                    导出设计令牌
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
          <Col span={24}>
            <FigmaDesignSpecView designSpec={designSpec} />
          </Col>
        </Row>
      )
    },
    {
      key: 'execute',
      label: '操作面板',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="Figma连接" className="connection-card">
              <Row gutter={[16, 16]} align="middle">
                <Col span={12}>
                  <div className="connection-status">
                    <Title level={5}>连接状态</Title>
                    {getStatusBadge()}
                  </div>
                </Col>
                <Col span={12} className="text-right">
                  <Button 
                    type="primary" 
                    icon={<LinkOutlined />}
                    onClick={() => setActiveTab('execute')}
                    disabled={!selectedConfig}
                  >
                    连接Figma
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="当前配置" className="current-config-card">
              {selectedConfig ? (
                <div className="current-config-info">
                  <p><strong>名称:</strong> {selectedConfig.name}</p>
                  <p><strong>文件ID:</strong> {selectedConfig.fileId || '未设置'}</p>
                  <p><strong>团队ID:</strong> {selectedConfig.teamId || '未设置'}</p>
                  <p><strong>状态:</strong> {selectedConfig.enabled ? '已启用' : '已禁用'}</p>
                </div>
              ) : (
                <div className="no-config-selected">
                  请先在配置管理中选择一个配置
                </div>
              )}
            </Card>
          </Col>
          <Col span={24}>
            <FigmaExecutePanel 
              config={selectedConfig}
              loading={loading}
              onExecuteAction={handleExecuteFigmaAction}
              onJoinChannel={handleJoinChannel}
              onGenerateDesignSpec={handleGenerateDesignSpec}
            />
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div className="figma-mcp-page">
      {/* 页面操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            {selectedConfig && (
              <Text type="secondary">
                当前配置: {selectedConfig.name}
              </Text>
            )}
          </Col>
          <Col>
            <Space>
              {getStatusBadge()}
              <Tooltip title="刷新配置列表">
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadConfigs} 
                  loading={loading}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 主要内容区域 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {!selectedConfig && activeTab !== 'configs' && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          请先选择或创建一个配置
        </div>
      )}
    </div>
  );
};

export default FigmaMCPPage; 