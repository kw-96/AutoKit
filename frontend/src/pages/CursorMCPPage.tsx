/**
 * CursorMCP管理页面
 */
import React, { useState, useEffect } from 'react';
import MCPConfigForm from '../components/cursorMCP/MCPConfigForm';
import MCPConfigList from '../components/cursorMCP/MCPConfigList';
import MCPExecuteModal from '../components/cursorMCP/MCPExecuteModal';
import { CursorMCPService } from '../services/cursorMCP/mcpService';
import { MCPConfig, MCPRequestParams } from '../services/cursorMCP/types';
import './CursorMCPPage.css';

const CursorMCPPage: React.FC = () => {
  const [configs, setConfigs] = useState<MCPConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<MCPConfig | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [executeModalVisible, setExecuteModalVisible] = useState(false);
  const [executingConfig, setExecutingConfig] = useState<MCPConfig | null>(null);
  const [executeResult, setExecuteResult] = useState<any>(null);

  // 加载MCP配置列表
  const loadConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await CursorMCPService.getAllConfigs();
      
      if (response.success) {
        setConfigs(response.data || []);
      } else {
        setError(response.error || '加载MCP配置失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载MCP配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    loadConfigs();
  }, []);

  // 显示成功消息，并在3秒后自动消失
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
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
    setError(null);
    
    try {
      const response = await CursorMCPService.deleteConfig(id);
      
      if (response.success) {
        showSuccessMessage('MCP配置已成功删除');
        loadConfigs();
      } else {
        setError(response.error || '删除MCP配置失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除MCP配置失败');
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
    setError(null);
    setExecuteResult(null);
    
    try {
      const response = await CursorMCPService.executeAction(executingConfig.id, params);
      
      if (response.success) {
        showSuccessMessage('MCP操作执行成功');
        setExecuteResult(response.data);
      } else {
        setError(response.error || 'MCP操作执行失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MCP操作执行失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (formData: Partial<MCPConfig>) => {
    setIsLoading(true);
    setError(null);
    
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
        setError(response.error || 'MCP配置保存失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MCP配置保存失败');
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
      <h1>CursorMCP 管理</h1>
      
      {/* 错误提示 */}
      {error && <div className="error-message">{error}</div>}
      
      {/* 成功提示 */}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {/* 操作按钮 */}
      <div className="actions">
        <button 
          className="add-button"
          onClick={handleAddConfig}
          disabled={isLoading}
        >
          添加MCP配置
        </button>
      </div>
      
      {/* 加载指示器 */}
      {isLoading && <div className="loading">加载中...</div>}
      
      {/* 表单 */}
      {isFormVisible && (
        <div className="form-container">
          <h2>{selectedConfig ? '编辑MCP配置' : '添加MCP配置'}</h2>
          <MCPConfigForm
            initialConfig={selectedConfig || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}
      
      {/* 配置列表 */}
      {!isFormVisible && (
        <div className="list-container">
          <h2>MCP配置列表</h2>
          <MCPConfigList
            configs={configs}
            onEdit={handleEditConfig}
            onDelete={handleDeleteConfig}
            onExecute={handleOpenExecuteModal}
          />
        </div>
      )}
      
      {/* 执行结果 */}
      {executeResult && (
        <div className="result-container">
          <h2>执行结果</h2>
          <pre className="result-code">{JSON.stringify(executeResult, null, 2)}</pre>
        </div>
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