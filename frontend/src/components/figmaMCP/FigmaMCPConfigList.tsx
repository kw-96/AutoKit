import React from 'react';
import List from 'antd/lib/list';
import Button from 'antd/lib/button';
import Tag from 'antd/lib/tag';
import Tooltip from 'antd/lib/tooltip';
import { DeleteOutlined, EditOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { MCPConfig } from '../../services/figmaMCP/types';
import './FigmaMCPConfigList.css';

interface FigmaMCPConfigListProps {
  configs: MCPConfig[];
  loading: boolean;
  selectedConfigId?: string;
  onSelect: (config: MCPConfig) => void;
  onDelete: (id: string) => void;
}

const FigmaMCPConfigList: React.FC<FigmaMCPConfigListProps> = ({ 
  configs = [], 
  loading, 
  selectedConfigId,
  onSelect,
  onDelete
}) => {
  // 确保configs始终是数组
  const safeConfigs = Array.isArray(configs) ? configs : [];
  
  return (
    <List
      className="figma-mcp-config-list"
      loading={loading}
      itemLayout="horizontal"
      dataSource={safeConfigs}
      renderItem={(config: MCPConfig) => (
        <List.Item
          key={config.id}
          className={`config-list-item ${selectedConfigId === config.id ? 'selected' : ''}`}
          onClick={() => onSelect(config)}
          actions={[
            <Tooltip title="编辑" key="edit">
              <Button 
                icon={<EditOutlined />} 
                size="small" 
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onSelect(config);
                }}
              />
            </Tooltip>,
            <Tooltip title="删除" key="delete">
              <Button 
                icon={<DeleteOutlined />} 
                size="small" 
                danger
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete(config.id);
                }}
              />
            </Tooltip>
          ]}
        >
          <List.Item.Meta
            title={
              <div className="config-title">
                {config.name}
                {config.enabled ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>启用</Tag>
                ) : (
                  <Tag color="error" icon={<StopOutlined />}>禁用</Tag>
                )}
              </div>
            }
            description={
              <div className="config-description">
                <div>{config.description || '无描述'}</div>
                {config.fileId && (
                  <div className="config-file-id">
                    <span>文件ID: </span>
                    <a 
                      href={`https://www.figma.com/file/${config.fileId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {config.fileId}
                    </a>
                  </div>
                )}
              </div>
            }
          />
        </List.Item>
      )}
      locale={{ emptyText: '暂无配置，请创建新配置' }}
    />
  );
};

export default FigmaMCPConfigList; 