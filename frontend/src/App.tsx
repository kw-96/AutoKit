import React, { useState } from 'react';
import McpConfigPage from './pages/McpConfigPage';
import DesignSystemPage from './pages/DesignSystemPage';
import ComponentGenPage from './pages/ComponentGenPage';
import DesignGenPage from './pages/DesignGenPage';
import CodeGenPage from './pages/CodeGenPage';
import { Layout, Menu, Typography } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  CodeOutlined,
  FileTextOutlined,
  BuildOutlined
} from '@ant-design/icons';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [page, setPage] = useState<'mcp' | 'design' | 'component' | 'designGen' | 'codeGen'>('mcp');
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <div style={{ height: 48, margin: 16, textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>AutoKit</div>
        <Menu
          mode="inline"
          selectedKeys={[page]}
          onClick={e => setPage(e.key as any)}
          style={{ height: '100%', borderRight: 0 }}
          items={[
            { key: 'mcp', icon: <SettingOutlined />, label: 'MCP配置管理' },
            { key: 'design', icon: <AppstoreOutlined />, label: '设计规范系统' },
            { key: 'component', icon: <BuildOutlined />, label: '组件生成' },
            { key: 'designGen', icon: <FileTextOutlined />, label: '设计稿生成' },
            { key: 'codeGen', icon: <CodeOutlined />, label: '前端代码生成' }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <Title level={3} style={{ margin: 0, lineHeight: '48px' }}>
            {page === 'mcp' && 'MCP配置管理'}
            {page === 'design' && '设计规范系统'}
            {page === 'component' && '组件生成'}
            {page === 'designGen' && '设计稿生成'}
            {page === 'codeGen' && '前端代码生成'}
          </Title>
        </Header>
        <Content style={{ margin: 24, background: '#fff', padding: 24, minHeight: 360 }}>
          {page === 'mcp' && <McpConfigPage />}
          {page === 'design' && <DesignSystemPage />}
          {page === 'component' && <ComponentGenPage />}
          {page === 'designGen' && <DesignGenPage />}
          {page === 'codeGen' && <CodeGenPage />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App; 