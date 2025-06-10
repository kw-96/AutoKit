import React from 'react';
import { Tabs, Card, Table, Empty, Typography, Tag } from 'antd';
import { DesignSpec, ColorToken, TypographyToken, SpacingToken, EffectToken, ComponentToken } from '../../services/figmaMCP/types';
import './FigmaDesignSpecView.css';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface FigmaDesignSpecViewProps {
  designSpec: DesignSpec | null;
}

const FigmaDesignSpecView: React.FC<FigmaDesignSpecViewProps> = ({ designSpec }) => {
  if (!designSpec) {
    return (
      <Card className="design-spec-empty-card">
        <Empty
          description="暂无设计规范数据，请先生成设计规范"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  // 颜色令牌列
  const colorColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '颜色值',
      dataIndex: 'value',
      key: 'value',
      render: (value: string) => (
        <div className="color-preview">
          <div className="color-swatch" style={{ backgroundColor: value }} />
          <Text>{value}</Text>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
  ];

  // 排版令牌列
  const typographyColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '字体',
      dataIndex: 'fontFamily',
      key: 'fontFamily',
    },
    {
      title: '字号',
      dataIndex: 'fontSize',
      key: 'fontSize',
      render: (fontSize: number) => `${fontSize}px`,
    },
    {
      title: '字重',
      dataIndex: 'fontWeight',
      key: 'fontWeight',
    },
    {
      title: '行高',
      dataIndex: 'lineHeight',
      key: 'lineHeight',
      render: (lineHeight: number | string) => lineHeight || '-',
    },
    {
      title: '字间距',
      dataIndex: 'letterSpacing',
      key: 'letterSpacing',
      render: (letterSpacing: number) => letterSpacing ? `${letterSpacing}px` : '-',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || '-',
    },
  ];

  // 间距令牌列
  const spacingColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `${value}px`,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
  ];

  // 效果令牌列
  const effectColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let color = 'default';
        if (type === 'shadow') color = 'blue';
        if (type === 'inner-shadow') color = 'purple';
        if (type === 'blur') color = 'cyan';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
  ];

  // 组件令牌列
  const componentColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '节点ID',
      dataIndex: 'nodeId',
      key: 'nodeId',
      render: (nodeId: string, record: ComponentToken) => (
        <Text ellipsis={{ tooltip: nodeId }}>{nodeId}</Text>
      ),
    },
    {
      title: '变体',
      dataIndex: 'variants',
      key: 'variants',
      render: (variants: Record<string, string> | undefined) => {
        if (!variants || Object.keys(variants).length === 0) return '-';
        return (
          <div className="variants-list">
            {Object.entries(variants).map(([key, value]) => (
              <Tag key={key}>{key}: {value}</Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
  ];

  return (
    <div className="design-spec-view">
      <Card className="design-spec-header-card">
        <Title level={4}>{designSpec.name}</Title>
        <Text type="secondary">{designSpec.description || '无描述'}</Text>
        <div className="design-spec-meta">
          <Tag color="blue">版本: {designSpec.version}</Tag>
          <Tag color="green">
            <a 
              href={`https://www.figma.com/file/${designSpec.fileId}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              查看Figma文件
            </a>
          </Tag>
        </div>
      </Card>

      <Tabs defaultActiveKey="colors" className="design-spec-tabs">
        <TabPane tab={`颜色 (${designSpec.colors.length})`} key="colors">
          <Table 
            dataSource={designSpec.colors} 
            columns={colorColumns} 
            rowKey="id" 
            pagination={false}
            className="design-spec-table"
          />
        </TabPane>
        <TabPane tab={`排版 (${designSpec.typography.length})`} key="typography">
          <Table 
            dataSource={designSpec.typography} 
            columns={typographyColumns} 
            rowKey="id" 
            pagination={false}
            className="design-spec-table"
          />
        </TabPane>
        <TabPane tab={`间距 (${designSpec.spacing.length})`} key="spacing">
          <Table 
            dataSource={designSpec.spacing} 
            columns={spacingColumns} 
            rowKey="id" 
            pagination={false}
            className="design-spec-table"
          />
        </TabPane>
        <TabPane tab={`效果 (${designSpec.effects.length})`} key="effects">
          <Table 
            dataSource={designSpec.effects} 
            columns={effectColumns} 
            rowKey="id" 
            pagination={false}
            className="design-spec-table"
          />
        </TabPane>
        <TabPane tab={`组件 (${designSpec.components.length})`} key="components">
          <Table 
            dataSource={designSpec.components} 
            columns={componentColumns} 
            rowKey="id" 
            pagination={false}
            className="design-spec-table"
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default FigmaDesignSpecView; 