import React, { useEffect, useState } from 'react';
import McpConfigForm from '../components/McpConfigForm';
import { List, Button, Popconfirm, message, Typography, Space } from 'antd';
const { Text } = Typography;

export interface McpConfig {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  createdAt: string;
}

const McpConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<McpConfig[]>([]);
  const [editing, setEditing] = useState<McpConfig | null>(null);

  const fetchConfigs = async () => {
    const res = await fetch('/api/mcp-config');
    const json = await res.json();
    let data = json.data;
    if (!Array.isArray(data)) {
      data = data ? [data] : [];
    }
    setConfigs(data);
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/mcp-config/${id}`, { method: 'DELETE' });
    fetchConfigs();
  };

  const handleEdit = (cfg: McpConfig) => {
    setEditing(cfg);
  };

  const handleUpdate = async (data: Partial<McpConfig>) => {
    if (!editing) return;
    const payload = { ...editing, ...data };
    await fetch(`/api/mcp-config/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setEditing(null);
    fetchConfigs();
  };

  return (
    <div>
      <h2>MCP配置管理</h2>
      <McpConfigForm onSuccess={fetchConfigs} />
      {editing && (
        <div style={{ border: '1px solid #ccc', padding: 8, marginBottom: 16 }}>
          <h4>编辑配置</h4>
          <McpConfigForm
            initial={editing}
            onSuccess={() => { setEditing(null); fetchConfigs(); }}
            onSubmit={handleUpdate}
            submitText="保存修改"
          />
          <Button onClick={() => setEditing(null)} style={{ marginTop: 8 }}>取消</Button>
        </div>
      )}
      <h3>配置列表</h3>
      <List
        bordered
        dataSource={configs || []}
        renderItem={(cfg: any) => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => handleEdit(cfg)} key="edit">编辑</Button>,
              <Popconfirm
                title="确定要删除该配置吗？"
                onConfirm={async () => { await handleDelete(cfg.id); message.success('删除成功'); }}
                okText="删除"
                cancelText="取消"
                key="delete"
              >
                <Button type="link" danger>删除</Button>
              </Popconfirm>
            ]}
          >
            <Space direction="vertical" size={0}>
              <Text strong>{cfg.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{cfg.type}</Text>
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: '暂无配置' }}
        style={{ maxWidth: 480 }}
      />
    </div>
  );
};

export default McpConfigPage; 