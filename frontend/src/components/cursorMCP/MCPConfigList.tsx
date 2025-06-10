/**
 * MCP配置列表组件
 */
import React from 'react';
import { MCPConfig } from '../../services/cursorMCP/types';
import './MCPConfigList.css';

interface MCPConfigListProps {
  configs: MCPConfig[];
  onEdit: (config: MCPConfig) => void;
  onDelete: (id: string) => void;
  onExecute: (config: MCPConfig) => void;
}

const MCPConfigList: React.FC<MCPConfigListProps> = ({ configs, onEdit, onDelete, onExecute }) => {
  if (configs.length === 0) {
    return <div className="empty-list">暂无MCP配置，请添加新配置。</div>;
  }

  return (
    <div className="mcp-config-list">
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>版本</th>
            <th>API端点</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {configs.map(config => (
            <tr key={config.id} className={config.enabled ? 'enabled' : 'disabled'}>
              <td>{config.name}</td>
              <td>{config.version}</td>
              <td>{config.apiEndpoint}</td>
              <td>
                <span className={`status ${config.enabled ? 'enabled' : 'disabled'}`}>
                  {config.enabled ? '已启用' : '已禁用'}
                </span>
              </td>
              <td className="actions">
                <button
                  className="edit-button"
                  onClick={() => onEdit(config)}
                  title="编辑"
                >
                  编辑
                </button>
                <button
                  className="delete-button"
                  onClick={() => onDelete(config.id)}
                  title="删除"
                >
                  删除
                </button>
                {config.enabled && (
                  <button
                    className="execute-button"
                    onClick={() => onExecute(config)}
                    title="执行"
                  >
                    执行
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MCPConfigList; 