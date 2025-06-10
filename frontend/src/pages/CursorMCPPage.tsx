/**
 * CursorMCP管理页面
 */
import React, { useState, useEffect } from 'react';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import message from 'antd/lib/message';
import Space from 'antd/lib/space';
import Typography from 'antd/lib/typography';
import MCPConfigForm from '../components/cursorMCP/MCPConfigForm';
import MCPConfigList from '../components/cursorMCP/MCPConfigList';
import MCPExecuteModal from '../components/cursorMCP/MCPExecuteModal';
import { CursorMCPService } from '../services/cursorMCP/mcpService';
import { MCPConfig, MCPRequestParams } from '../services/cursorMCP/types';
import './CursorMCPPage.css';

const { Text } = Typography;

const CursorMCPPage: React.FC = () => {
  const [configs, setConfigs] = useState<MCPConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<MCPConfig | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [executeModalVisible, setExecuteModalVisible] = useState(false);
  const [executingConfig, setExecutingConfig] = useState<MCPConfig | null>(null);
  const [executeResult, setExecuteResult] = useState<any>(null);

  // 加载MCP配置列表
  const loadConfigs = async () => {
    setIsLoading(true);
    
    try {
      const response = await CursorMCPService.getAllConfigs();
      
      if (response.success) {
        setConfigs(response.data || []);
      } else {
        message.error(response.error || '加载MCP配置失败');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载MCP配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    loadConfigs();
  }, []);

  // 显示成功消息
  const showSuccessMessage = (msg: string) => {
    message.success(msg);
  };

  // 处理添加新配置
  const handleAddConfig = () => {
    setSelectedConfig(null);
    setIsFormVisible(true);
  };

  // 处理编辑配置
  const handleEditConfig = (config: MCPConfig) => {
    setSelectedConfig(config);
    setIsFormVisible(true);
  };

  // 处理删除配置
  const handleDeleteConfig = async (id: string) => {
    if (!window.confirm('确定要删除此MCP配置吗？')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await CursorMCPService.deleteConfig(id);
      
      if (response.success) {
        showSuccessMessage('MCP配置已成功删除');
        loadConfigs();
      } else {
        message.error(response.error || '删除MCP配置失败');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除MCP配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 打开执行MCP操作模态框
  const handleOpenExecuteModal = (config: MCPConfig) => {
    setExecutingConfig(config);
    setExecuteModalVisible(true);
    setExecuteResult(null);
  };

  // 关闭执行MCP操作模态框
  const handleCloseExecuteModal = () => {
    setExecuteModalVisible(false);
    setExecutingConfig(null);
  };

  // 处理执行MCP操作
  const handleExecuteAction = async (params: MCPRequestParams) => {
    if (!executingConfig) return;
    
    setIsLoading(true);
    setExecuteResult(null);
    
    try {
      const response = await CursorMCPService.executeAction(executingConfig.id, params);
      
      if (response.success) {
        showSuccessMessage('MCP操作执行成功');
        setExecuteResult(response.data);
      } else {
        message.error(response.error || 'MCP操作执行失败');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'MCP操作执行失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (formData: Partial<MCPConfig>) => {
    setIsLoading(true);
    
    try {
      let response;
      
      if (selectedConfig) {
        // 更新现有配置
        response = await CursorMCPService.updateConfig(selectedConfig.id, formData);
        
        if (response.success) {
          showSuccessMessage('MCP配置已成功更新');
        }
      } else {
        // 创建新配置
        response = await CursorMCPService.createConfig(formData as Omit<MCPConfig, 'id' | 'createdAt' | 'updatedAt'>);
        
        if (response.success) {
          showSuccessMessage('MCP配置已成功创建');
        }
      }
      
      if (response.success) {
        setIsFormVisible(false);
        loadConfigs();
      } else {
        message.error(response.error || 'MCP配置保存失败');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'MCP配置保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理表单取消
  const handleFormCancel = () => {
    setIsFormVisible(false);
  };

  return (
    <div className="cursor-mcp-page">
      {/* 操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary"
          onClick={handleAddConfig}
          loading={isLoading}
        >
          添加MCP配置
        </Button>
      </div>
      
      {/* 表单区域 */}
      {isFormVisible && (
        <Card 
          title={selectedConfig ? '编辑MCP配置' : '添加MCP配置'}
          style={{ marginBottom: 16 }}
        >
          <MCPConfigForm
            initialConfig={selectedConfig || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </Card>
      )}
      
      {/* 配置列表 */}
      {!isFormVisible && (
        <Card title="MCP配置列表">
          <MCPConfigList
            configs={configs}
            onEdit={handleEditConfig}
            onDelete={handleDeleteConfig}
            onExecute={handleOpenExecuteModal}
          />
        </Card>
      )}
      
      {/* 执行结果 */}
      {executeResult && (
        <Card title="执行结果" style={{ marginTop: 16 }}>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: 16, 
            borderRadius: 4,
            overflow: 'auto'
          }}>
            {JSON.stringify(executeResult, null, 2)}
          </pre>
        </Card>
      )}
      
      {/* 执行模态框 */}
      {executeModalVisible && executingConfig && (
        <MCPExecuteModal
          config={executingConfig}
          onExecute={handleExecuteAction}
          onCancel={handleCloseExecuteModal}
        />
      )}
    </div>
  );
};

export default CursorMCPPage; 