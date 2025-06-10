/**
 * MCP操作执行模态框组件
 */
import React, { useState } from 'react';
import { MCPConfig, MCPRequestParams } from '../../services/cursorMCP/types';
import './MCPExecuteModal.css';

// 常用MCP操作列表
const COMMON_ACTIONS = [
  {
    name: 'get_document_info',
    description: '获取当前Figma文档信息',
    payload: {}
  },
  {
    name: 'get_selection',
    description: '获取当前选择的元素',
    payload: {}
  },
  {
    name: 'read_my_design',
    description: '读取当前设计详情',
    payload: {}
  },
  {
    name: 'get_styles',
    description: '获取所有样式',
    payload: {}
  },
  {
    name: 'get_local_components',
    description: '获取本地组件',
    payload: {}
  }
];

interface MCPExecuteModalProps {
  config: MCPConfig;
  onExecute: (params: MCPRequestParams) => void;
  onCancel: () => void;
}

const MCPExecuteModal: React.FC<MCPExecuteModalProps> = ({ config, onExecute, onCancel }) => {
  const [action, setAction] = useState<string>('');
  const [payload, setPayload] = useState<string>('{}');
  const [error, setError] = useState<string | null>(null);
  const [showCommonActions, setShowCommonActions] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!action.trim()) {
      setError('操作名称不能为空');
      return;
    }

    try {
      const parsedPayload = payload.trim() ? JSON.parse(payload) : {};
      
      onExecute({
        action,
        payload: parsedPayload,
        options: {}
      });
    } catch (err) {
      setError('Payload 必须是有效的 JSON 格式');
    }
  };

  const handleSelectCommonAction = (commonAction: typeof COMMON_ACTIONS[0]) => {
    setAction(commonAction.name);
    setPayload(JSON.stringify(commonAction.payload, null, 2));
    setShowCommonActions(false);
  };

  return (
    <div className="mcp-execute-modal-overlay">
      <div className="mcp-execute-modal">
        <div className="modal-header">
          <h3>执行 MCP 操作</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="config-info">
            <p><strong>配置名称:</strong> {config.name}</p>
            <p><strong>API端点:</strong> {config.apiEndpoint}</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group action-input-group">
              <label htmlFor="action">操作名称 *</label>
              <div className="action-input-wrapper">
                <input
                  type="text"
                  id="action"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="例如: get_document_info"
                />
                <button 
                  type="button" 
                  className="common-actions-button"
                  onClick={() => setShowCommonActions(!showCommonActions)}
                >
                  {showCommonActions ? '隐藏常用操作' : '常用操作'}
                </button>
              </div>
              
              {showCommonActions && (
                <div className="common-actions-dropdown">
                  {COMMON_ACTIONS.map((commonAction, index) => (
                    <div 
                      key={index} 
                      className="common-action-item"
                      onClick={() => handleSelectCommonAction(commonAction)}
                    >
                      <div className="common-action-name">{commonAction.name}</div>
                      <div className="common-action-description">{commonAction.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="payload">Payload (JSON)</label>
              <textarea
                id="payload"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="例如: { &quot;nodeId&quot;: &quot;123&quot; }"
              />
              <div className="hint">输入有效的 JSON 格式数据作为操作参数</div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="execute-button">执行</button>
              <button type="button" className="cancel-button" onClick={onCancel}>取消</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MCPExecuteModal; 