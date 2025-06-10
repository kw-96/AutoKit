import React, { useState } from 'react';
import Typography from 'antd/lib/typography';
import Card from 'antd/lib/card';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Tabs from 'antd/lib/tabs';
import Divider from 'antd/lib/divider';
import Tag from 'antd/lib/tag';
import Alert from 'antd/lib/alert';
import Table from 'antd/lib/table';
import Space from 'antd/lib/space';
import FloatButton from 'antd/lib/float-button';
import { 
  AppstoreOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  BorderOutlined,
  BoxPlotOutlined,
  BlockOutlined,
  LayoutOutlined,
  FileTextOutlined,
  ToolOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import './DesignSystemGuidePage.css';

const { Title, Paragraph, Text } = Typography;

interface ColorItem {
  name: string;
  value: string;
  usage: string;
  type: 'primary' | 'success' | 'warning' | 'error' | 'default';
}

interface TypographyItem {
  name: string;
  size: string;
  weight: string;
  lineHeight: string;
  usage: string;
}

const DesignSystemGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // 颜色数据
  const colorData: ColorItem[] = [
    { name: 'Primary/500', value: '#0ea5e9', usage: '主要按钮、链接、品牌元素', type: 'primary' },
    { name: 'Success/500', value: '#10b981', usage: '成功状态、确认操作', type: 'success' },
    { name: 'Warning/500', value: '#f59e0b', usage: '警告信息、注意事项', type: 'warning' },
    { name: 'Error/500', value: '#ef4444', usage: '错误状态、危险操作', type: 'error' },
    { name: 'Neutral/500', value: '#64748b', usage: '次要文本、辅助信息', type: 'default' }
  ];

  // 字体数据
  const typographyData: TypographyItem[] = [
    { name: 'Display/Large', size: '48px', weight: '700', lineHeight: '1.2', usage: '主标题、英雄区域' },
    { name: 'Heading/XL', size: '28px', weight: '600', lineHeight: '1.3', usage: '一级标题' },
    { name: 'Heading/Large', size: '24px', weight: '600', lineHeight: '1.3', usage: '二级标题' },
    { name: 'Body/Large', size: '16px', weight: '400', lineHeight: '1.5', usage: '正文大号' },
    { name: 'Body/Medium', size: '14px', weight: '400', lineHeight: '1.5', usage: '正文默认' }
  ];

  // 间距数据
  const spacingData = [
    { value: '4px', name: 'Tight', usage: '组件内部小间距' },
    { value: '8px', name: 'Small', usage: '组件内部间距' },
    { value: '16px', name: 'Medium', usage: '基础单位，常用间距' },
    { value: '24px', name: 'Large', usage: '组件外部间距' },
    { value: '32px', name: 'Extra Large', usage: '区块间距' },
    { value: '48px', name: 'XXXL', usage: '页面布局间距' }
  ];

  // 阴影数据
  const shadowData = [
    { name: 'Shadow/Small', value: '0 1px 2px rgba(0,0,0,0.05)', usage: '按钮、小卡片' },
    { name: 'Shadow/Medium', value: '0 4px 6px rgba(0,0,0,0.07)', usage: '卡片、下拉菜单' },
    { name: 'Shadow/Large', value: '0 10px 15px rgba(0,0,0,0.1)', usage: '模态框、浮层' }
  ];

  const colorColumns = [
    {
      title: '颜色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ColorItem) => (
        <Space>
          <div 
            className="color-preview" 
            style={{ backgroundColor: record.value }}
          />
          <Text code>{text}</Text>
        </Space>
      )
    },
    {
      title: 'HEX 值',
      dataIndex: 'value',
      key: 'value',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '使用场景',
      dataIndex: 'usage',
      key: 'usage'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colorMap: Record<string, { color: string; icon: React.ReactNode }> = {
          primary: { color: 'blue', icon: <BlockOutlined /> },
          success: { color: 'green', icon: <CheckCircleOutlined /> },
          warning: { color: 'orange', icon: <WarningOutlined /> },
          error: { color: 'red', icon: <CloseCircleOutlined /> },
          default: { color: 'default', icon: <ExclamationCircleOutlined /> }
        };
        return (
          <Tag color={colorMap[type]?.color}>
            {colorMap[type]?.icon} {type}
          </Tag>
        );
      }
    }
  ];

  const typographyColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '字号',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: '字重',
      dataIndex: 'weight',
      key: 'weight'
    },
    {
      title: '行高',
      dataIndex: 'lineHeight',
      key: 'lineHeight'
    },
    {
      title: '使用场景',
      dataIndex: 'usage',
      key: 'usage'
    }
  ];

  // 概述内容组件
  const OverviewContent = () => (
    <div>
      {/* 页面头部 */}
      <div className="design-guide-header" style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={1}>
          <AppstoreOutlined /> Figma组件库详细整理标准
        </Title>
        <Paragraph className="header-subtitle" style={{ fontSize: 16, color: '#666' }}>
          AutoKit设计系统
        </Paragraph>
      </div>

      <Alert
        message="目标"
        description="建立一套标准化的Figma组件库整理规范，确保与AutoKit项目的设计系统生成功能完美集成，支持从设计到代码的自动化工作流。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Title level={3}>核心原则</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small" className="principle-card">
            <div className="principle-item">
              <LinkOutlined className="principle-icon" />
              <div>
                <Text strong>API兼容性</Text>
                <br />
                <Text type="secondary">完全匹配AutoKit的Figma API提取逻辑</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small" className="principle-card">
            <div className="principle-item">
              <BlockOutlined className="principle-icon" />
              <div>
                <Text strong>可维护性</Text>
                <br />
                <Text type="secondary">清晰的命名和组织结构便于长期维护</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small" className="principle-card">
            <div className="principle-item">
              <BlockOutlined className="principle-icon" />
              <div>
                <Text strong>扩展性</Text>
                <br />
                <Text type="secondary">支持组件库随项目需求持续扩展</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 目录结构内容组件
  const StructureContent = () => (
    <div>
      <Title level={2}>📁 目录结构</Title>
      <Paragraph>清晰的逻辑分层Figma文件组织结构</Paragraph>
      
      <Card className="code-card">
        <pre className="directory-tree">
{`📁 组件库
├── 🎨 01-设计令牌
│   ├── 颜色系统
│   ├── 字体系统
│   ├── 间距系统
│   └── 阴影系统
├── 🧩 02-基础组件
│   ├── 按钮组件
│   ├── 表单组件
│   ├── 弹窗组件
│   └── 导航组件
├── 📱 03-布局组件
│   ├── 容器组件
│   ├── 网格系统
│   ├── 卡片组件
│   └── Modal组件
├── 🌐 04-页面模板
│   ├── 主页
│   ├── 内容页
│   ├── 设置
│   └── 登录页
├── 🔧 05-工具组件
│   ├── 图标组件
│   ├── 插画组件
│   └── 头像组件
└── 📚 06-文档
    ├── 使用指南
    ├── 设计原则
    └── 设计规范 `}
        </pre>
      </Card>
      
      <Alert
        message="注意"
        description="页面命名使用数字前缀确保排序，便于快速定位。"
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  );

  // 设计令牌内容组件
  const TokensContent = () => (
    <div>
      <Title level={2}>
        <BgColorsOutlined /> 01-Design Tokens 设计令牌
      </Title>
      <Paragraph>设计令牌是设计系统的基础，定义了所有视觉属性的标准值。</Paragraph>

      {/* 颜色系统 */}
      <div className="subsection">
        <Title level={3}>1.1 颜色系统 (Colors Page)</Title>
        
        <Title level={4}>主色板结构</Title>
        <Card className="code-card">
          <pre>
{`🎨 Primary Palette
├── Primary/50   (#f0f9ff) - 最浅色调
├── Primary/100  (#e0f2fe) 
├── Primary/200  (#bae6fd)
├── Primary/300  (#7dd3fc)
├── Primary/400  (#38bdf8)
├── Primary/500  (#0ea5e9) ← 主色
├── Primary/600  (#0284c7)
├── Primary/700  (#0369a1)
├── Primary/800  (#075985)
└── Primary/900  (#0c4a6e) - 最深色调`}
          </pre>
        </Card>

        <Title level={4}>语义化颜色</Title>
        <Table
          columns={colorColumns}
          dataSource={colorData}
          rowKey="name"
          pagination={false}
          size="small"
          className="color-table"
        />

        <Alert
          message="Figma设置要求"
          description={
            <ul>
              <li>每个颜色必须创建为 <Text code>Color Style</Text></li>
              <li>命名格式：<Text code>Color/Category/Variant</Text></li>
              <li>描述中包含：HEX值、RGB值、使用场景</li>
              <li>设置为 <Text code>Published Style</Text> 以便API获取</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </div>

      {/* 字体系统 */}
      <div className="subsection" style={{ marginTop: 32 }}>
        <Title level={3}>
          <FontSizeOutlined /> 1.2 字体系统 (Typography Page)
        </Title>
        
        <Table
          columns={typographyColumns}
          dataSource={typographyData}
          rowKey="name"
          pagination={false}
          size="small"
          className="typography-table"
        />
      </div>

      {/* 间距系统 */}
      <div className="subsection" style={{ marginTop: 32 }}>
        <Title level={3}>
          <BorderOutlined /> 1.3 间距系统 (Spacing Page)
        </Title>
        
        <Row gutter={[16, 16]}>
          {spacingData.map((spacing, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card size="small" className="spacing-card">
                <div className="spacing-item">
                  <div 
                    className="spacing-preview" 
                    style={{ width: spacing.value, height: spacing.value }}
                  />
                  <div className="spacing-info">
                    <Text strong>{spacing.value}</Text>
                    <br />
                    <Text type="secondary" className="spacing-name">{spacing.name}</Text>
                    <br />
                    <Text className="spacing-usage">{spacing.usage}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 阴影系统 */}
      <div className="subsection" style={{ marginTop: 32 }}>
        <Title level={3}>
          <BoxPlotOutlined /> 1.5 阴影系统 (Shadow Page)
        </Title>
        
        <Row gutter={[16, 16]}>
          {shadowData.map((shadow, index) => (
            <Col xs={24} md={8} key={index}>
              <Card size="small" className="shadow-card">
                <div 
                  className="shadow-preview" 
                  style={{ boxShadow: shadow.value }}
                />
                <div className="shadow-info">
                  <Text strong>{shadow.name}</Text>
                  <br />
                  <Text code className="shadow-value">{shadow.value}</Text>
                  <br />
                  <Text type="secondary">{shadow.usage}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );

  // 基础组件内容
  const ComponentsContent = () => (
    <div>
      <Title level={2}>
        <BlockOutlined /> 02-Foundation Components 基础组件
      </Title>

      <div className="subsection">
        <Title level={3}>2.1 按钮组件 (Buttons Page)</Title>
        
        <Alert
          message="按钮变体矩阵"
          description="每个按钮类型需要包含不同尺寸和状态的完整变体"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Card className="code-card">
          <pre>
{`🔘 Button Components
├── Button/Primary
│   ├── Size=Large, State=Default
│   ├── Size=Large, State=Hover  
│   ├── Size=Large, State=Active
│   ├── Size=Large, State=Disabled
│   ├── Size=Medium, State=Default
│   └── Size=Small, State=Default
├── Button/Secondary
├── Button/Ghost
├── Button/Danger
└── Button/Link`}
          </pre>
        </Card>

        <Title level={4}>按钮尺寸规范</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" className="button-spec-card">
              <Title level={5}>Large Button</Title>
              <p><Text strong>高度：</Text>48px</p>
              <p><Text strong>内边距：</Text>16px 24px</p>
              <p><Text strong>字体：</Text>Button/Large (16px)</p>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="button-spec-card">
              <Title level={5}>Medium Button</Title>
              <p><Text strong>高度：</Text>40px</p>
              <p><Text strong>内边距：</Text>12px 20px</p>
              <p><Text strong>字体：</Text>Button/Medium (14px)</p>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="button-spec-card">
              <Title level={5}>Small Button</Title>
              <p><Text strong>高度：</Text>32px</p>
              <p><Text strong>内边距：</Text>8px 16px</p>
              <p><Text strong>字体：</Text>Button/Small (12px)</p>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider />

      <div className="subsection">
        <Title level={3}>2.2 表单组件 (Form Controls Page)</Title>
        <Card className="code-card">
          <pre>
{`📝 Input Components
├── Input/Text
│   ├── State=Default, Size=Large
│   ├── State=Focus, Size=Large
│   ├── State=Error, Size=Large
│   └── State=Disabled, Size=Large
├── Input/Password
├── Input/Search
└── Input/Number`}
          </pre>
        </Card>
      </div>

      <Divider />

      <div className="subsection">
        <Title level={3}>2.3 弹窗组件 (Modal Page)</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card size="small" title="Alert 组件" className="feedback-card">
              <ul>
                <li>Alert/Info - 信息提示</li>
                <li>Alert/Success - 成功反馈</li>
                <li>Alert/Warning - 警告信息</li>
                <li>Alert/Error - 错误提示</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" title="Toast 组件" className="feedback-card">
              <ul>
                <li>Toast/Success - 操作成功 (3-5秒)</li>
                <li>Toast/Warning - 操作警告 (5-8秒)</li>
                <li>Toast/Error - 操作失败 (手动关闭)</li>
                <li>Toast/Info - 系统通知 (3-5秒)</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );

  // 其他内容组件（简化版本）
  const LayoutContent = () => (
    <div>
      <Title level={2}>
        <LayoutOutlined /> 03-Layout Components 布局组件
      </Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" title="容器组件" className="layout-card">
            <ul>
              <li>Container/Fluid (100%)</li>
              <li>Container/Fixed</li>
              <li>Container/Constrained (1440px)</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" title="网格系统" className="layout-card">
            <ul>
              <li>12列网格</li>
              <li>列间距：24px</li>
              <li>响应式断点</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" title="卡片组件" className="layout-card">
            <ul>
              <li>Card/Basic</li>
              <li>Card/With Header</li>
              <li>Card/Interactive</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" title="模态框组件" className="layout-card">
            <ul>
              <li>Modal/Small (400px)</li>
              <li>Modal/Medium (600px)</li>
              <li>Modal/Large (800px)</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const TemplatesContent = () => (
    <div>
      <Title level={2}>
        <FileTextOutlined /> 04-Page Templates 页面模板
      </Title>
      
      <Card className="code-card">
        <pre>
{`🏠 Page Templates
├── Template/Dashboard
│   ├── Header
│   ├── Sidebar  
│   ├── Main Content
│   └── Footer
├── Template/Landing
├── Template/Auth
│   ├── Login
│   ├── Register
│   └── Reset Password
├── Template/Settings
└── Template/Profile`}
        </pre>
      </Card>
    </div>
  );

  const UtilitiesContent = () => (
    <div>
      <Title level={2}>
        <ToolOutlined /> 05-Utilities 工具组件
      </Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card size="small" title="图标系统" className="utility-card">
            <ul>
              <li>Icons/16px (小图标)</li>
              <li>Icons/20px (默认)</li>
              <li>Icons/24px (中等)</li>
              <li>Icons/32px (大图标)</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card size="small" title="插图和头像" className="utility-card">
            <ul>
              <li>Avatar/User</li>
              <li>Avatar/Group</li>
              <li>Empty States</li>
              <li>Loading States</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const IntegrationContent = () => (
    <div>
      <Title level={2}>
        <LinkOutlined /> AutoKit集成配置
      </Title>
      
      <Alert
        message="API提取优化设置"
        description="确保所有设计令牌都设置为Published Styles以便API正确获取"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Title level={3}>命名约定严格要求</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card size="small" className="naming-card error">
            <Title level={5}>Styles命名</Title>
            <p>✅ 正确: <Text code>Color/Primary/500</Text>, <Text code>Typography/Heading/H1</Text></p>
            <p>❌ 错误: <Text code>primary-blue</Text>, <Text code>heading-large</Text></p>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card size="small" className="naming-card error">
            <Title level={5}>Components命名</Title>
            <p>✅ 正确: <Text code>Button/Primary</Text>, <Text code>Input/Text</Text></p>
            <p>❌ 错误: <Text code>primary-button</Text>, <Text code>text-input</Text></p>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const BestPracticesContent = () => (
    <div>
      <Title level={2}>💡 最佳实践</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small" title="🎨 设计原则" className="practice-card">
            <ul className="practice-list">
              <li>✅ 保持设计的一致性</li>
              <li>✅ 遵循可访问性标准</li>
              <li>✅ 使用语义化的命名</li>
              <li>✅ 建立清晰的视觉层次</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" title="🔧 技术规范" className="practice-card">
            <ul className="practice-list">
              <li>✅ 所有组件使用Auto Layout</li>
              <li>✅ 设置完整的Component Properties</li>
              <li>✅ 发布所有Styles和Components</li>
              <li>✅ 编写详细的组件描述</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" title="👥 团队协作" className="practice-card">
            <ul className="practice-list">
              <li>✅ 定期同步设计规范</li>
              <li>✅ 建立代码审查流程</li>
              <li>✅ 维护详细的文档</li>
              <li>✅ 设置合理的权限管理</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 定义标签页配置
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <AppstoreOutlined />
          概述
        </span>
      ),
      children: <OverviewContent />
    },
    {
      key: 'structure',
      label: (
        <span>
          <FileTextOutlined />
          目录结构
        </span>
      ),
      children: <StructureContent />
    },
    {
      key: 'tokens',
      label: (
        <span>
          <BgColorsOutlined />
          设计令牌
        </span>
      ),
      children: <TokensContent />
    },
    {
      key: 'components',
      label: (
        <span>
          <BlockOutlined />
          基础组件
        </span>
      ),
      children: <ComponentsContent />
    },
    {
      key: 'layout',
      label: (
        <span>
          <LayoutOutlined />
          布局组件
        </span>
      ),
      children: <LayoutContent />
    },
    {
      key: 'templates',
      label: (
        <span>
          <FileTextOutlined />
          页面模板
        </span>
      ),
      children: <TemplatesContent />
    },
    {
      key: 'utilities',
      label: (
        <span>
          <ToolOutlined />
          工具组件
        </span>
      ),
      children: <UtilitiesContent />
    },
    {
      key: 'integration',
      label: (
        <span>
          <LinkOutlined />
          AutoKit集成
        </span>
      ),
      children: <IntegrationContent />
    },
    {
      key: 'best-practices',
      label: (
        <span>
          💡
          最佳实践
        </span>
      ),
      children: <BestPracticesContent />
    }
  ];

  return (
    <div className="design-system-guide-page">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
        items={tabItems}
      />
      <FloatButton.BackTop />
    </div>
  );
};

export default DesignSystemGuidePage;