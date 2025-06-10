import React, { useState, useEffect } from 'react';
import { Card, Button, Tabs, message } from 'antd';
import FigmaMCPConfigForm from '../components/figmaMCP/FigmaMCPConfigForm';
import FigmaMCPConfigList from '../components/figmaMCP/FigmaMCPConfigList';
import FigmaDesignSpecView from '../components/figmaMCP/FigmaDesignSpecView';
import FigmaExecutePanel from '../components/figmaMCP/FigmaExecutePanel';
import { FigmaMCPService } from '../services/figmaMCP/figmaMcpService';
import { MCPConfig } from '../services/figmaMCP/types';
import './FigmaMCPPage.css';

const { TabPane } = Tabs;

const FigmaMCPPage: React.FC = () => {
  const [configs, setConfigs] = useState<MCPConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<MCPConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('configs');
  const [designSpec, setDesignSpec] = useState<any>(null);

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
      message.warning('请先选择一个配置');
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
      message.warning('请先选择一个配置');
      return;
    }

    try {
      setLoading(true);
      const response = await FigmaMCPService.executeFigmaAction(selectedConfig.id, action, payload);
      if (response.success) {
        message.success('操作执行成功');
        return response.data;
      } else {
        message.error(`操作执行失败: ${response.error}`);
        return null;
      }
    } catch (error) {
      message.error(`操作执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 加入通道
  const handleJoinChannel = async (channelId: string) => {
    if (!selectedConfig) {
      message.warning('请先选择一个配置');
      return;
    }

    try {
      setLoading(true);
      const response = await FigmaMCPService.joinChannel(selectedConfig.id, channelId);
      if (response.success) {
        message.success('已加入通道');
        return response.data;
      } else {
        message.error(`加入通道失败: ${response.error}`);
        return null;
      }
    } catch (error) {
      message.error(`加入通道失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="figma-mcp-page">
      <Card title="Figma MCP" className="figma-mcp-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="配置管理" key="configs">
            <div className="figma-mcp-content">
              <div className="config-list-container">
                <FigmaMCPConfigList 
                  configs={configs} 
                  loading={loading} 
                  onSelect={handleConfigSelect}
                  onDelete={handleConfigDelete}
                  selectedConfigId={selectedConfig?.id}
                />
              </div>
              <div className="config-form-container">
                <FigmaMCPConfigForm 
                  config={selectedConfig} 
                  loading={loading} 
                  onSubmit={selectedConfig ? 
                    (config) => handleConfigUpdate(selectedConfig.id, config) : 
                    handleConfigCreate
                  }
                />
              </div>
            </div>
          </TabPane>
          <TabPane tab="设计规范" key="design-spec">
            <div className="design-spec-container">
              <div className="design-spec-actions">
                <Button 
                  type="primary" 
                  onClick={handleGenerateDesignSpec} 
                  loading={loading}
                  disabled={!selectedConfig}
                >
                  生成设计规范
                </Button>
              </div>
              <FigmaDesignSpecView designSpec={designSpec} />
            </div>
          </TabPane>
          <TabPane tab="Figma操作" key="execute">
            <FigmaExecutePanel 
              onExecute={handleExecuteFigmaAction} 
              onJoinChannel={handleJoinChannel}
              loading={loading}
              disabled={!selectedConfig}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default FigmaMCPPage; 