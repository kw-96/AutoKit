import React, { useEffect } from 'react';
import { Form, Input, Button, Switch, Card, Divider, InputNumber, Select, Tooltip } from 'antd';
import { MCPConfig, MCPSettings } from '../../services/figmaMCP/types';
import { QuestionCircleOutlined } from '@ant-design/icons';
import './FigmaMCPConfigForm.css';

const { Option } = Select;

interface FigmaMCPConfigFormProps {
  config: MCPConfig | null;
  loading: boolean;
  onSubmit: (config: Partial<MCPConfig>) => void;
}

const FigmaMCPConfigForm: React.FC<FigmaMCPConfigFormProps> = ({ config, loading, onSubmit }) => {
  const [form] = Form.useForm();

  // 当配置变化时重置表单
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        name: config.name,
        description: config.description,
        apiKey: config.apiKey,
        fileId: config.fileId,
        teamId: config.teamId,
        enabled: config.enabled,
        socketUrl: config.settings?.socketUrl || `ws://localhost:3055`,
        channelId: config.settings?.channelId,
        pluginId: config.settings?.pluginId,
        defaultExportFormat: config.settings?.defaultExportFormat || 'PNG',
        defaultExportScale: config.settings?.defaultExportScale || 1,
        autoConnect: config.settings?.autoConnect !== undefined ? config.settings?.autoConnect : true
      });
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        enabled: true,
        socketUrl: `ws://localhost:3055`,
        defaultExportFormat: 'PNG',
        defaultExportScale: 1,
        autoConnect: true
      });
    }
  }, [config, form]);

  // 处理表单提交
  const handleSubmit = (values: any) => {
    const { 
      name, description, apiKey, fileId, teamId, enabled,
      socketUrl, channelId, pluginId, defaultExportFormat, defaultExportScale, autoConnect
    } = values;

    const settings: MCPSettings = {
      socketUrl: socketUrl || `ws://localhost:3055`,
      channelId,
      pluginId,
      defaultExportFormat: defaultExportFormat || 'PNG',
      defaultExportScale: defaultExportScale || 1,
      autoConnect: autoConnect !== undefined ? autoConnect : true
    };

    const formData: Partial<MCPConfig> = {
      name,
      description,
      apiKey,
      fileId,
      teamId,
      enabled: enabled !== undefined ? enabled : true,
      settings
    };

    onSubmit(formData);
  };

  return (
    <Card 
      title={config ? '编辑配置' : '新建配置'} 
      className="figma-mcp-config-form-card"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="figma-mcp-config-form"
        initialValues={{
          enabled: true,
          socketUrl: `ws://localhost:3055`,
          defaultExportFormat: 'PNG',
          defaultExportScale: 1,
          autoConnect: true
        }}
      >
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入配置名称' }]}
        >
          <Input placeholder="配置名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea placeholder="配置描述（可选）" rows={2} />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label={
            <span>
              Figma API密钥 
              <Tooltip title="在Figma账户设置中创建个人访问令牌">
                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: '请输入Figma API密钥' }]}
        >
          <Input.Password placeholder="Figma API密钥" />
        </Form.Item>

        <Form.Item
          name="fileId"
          label={
            <span>
              Figma文件ID
              <Tooltip title="从Figma文件URL中获取，格式如：https://www.figma.com/file/XXXX/，其中XXXX部分即为文件ID">
                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
        >
          <Input placeholder="Figma文件ID（可选）" />
        </Form.Item>

        <Form.Item
          name="teamId"
          label="Figma团队ID"
        >
          <Input placeholder="Figma团队ID（可选）" />
        </Form.Item>

        <Form.Item
          name="enabled"
          label="启用"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider>WebSocket设置（通常无需修改）</Divider>

        <Form.Item
          name="socketUrl"
          label={
            <span>
              WebSocket URL
              <Tooltip title="本地WebSocket服务器地址，默认值通常无需修改">
                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
        >
          <Input placeholder="WebSocket服务器URL" />
        </Form.Item>

        <Form.Item
          name="channelId"
          label={
            <span>
              通道ID
              <Tooltip title="设置固定的通道ID，用于与Figma插件通信。设置相同的ID可以确保每次连接到同一通道。">
                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
        >
          <Input placeholder="设置固定通道ID（推荐设置，例如：autokit）" />
          <div style={{ marginTop: 4, fontSize: 12, color: '#1890ff' }}>
            推荐设置固定通道ID，在Figma插件中使用相同的ID可确保稳定连接
          </div>
        </Form.Item>

        <Form.Item
          name="pluginId"
          label="插件ID"
        >
          <Input placeholder="Figma插件ID（可选）" />
        </Form.Item>

        <Form.Item
          name="defaultExportFormat"
          label="默认导出格式"
        >
          <Select placeholder="选择默认导出格式">
            <Option value="PNG">PNG</Option>
            <Option value="JPG">JPG</Option>
            <Option value="SVG">SVG</Option>
            <Option value="PDF">PDF</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="defaultExportScale"
          label="默认导出缩放"
        >
          <InputNumber min={0.1} max={4} step={0.1} />
        </Form.Item>

        <Form.Item
          name="autoConnect"
          label={
            <span>
              自动连接
              <Tooltip title="启用后将在配置加载时自动连接WebSocket服务器">
                <QuestionCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="submit-button"
          >
            {config ? '更新' : '创建'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FigmaMCPConfigForm; 