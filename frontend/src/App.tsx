import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from 'antd/lib/layout';
import Menu from 'antd/lib/menu';
import {
  AppstoreOutlined,
  SettingOutlined,
  CodeOutlined,
  FileOutlined,
  ApiOutlined,
  BookOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

import FigmaMCPPage from './pages/FigmaMCPPage';
import DesignSystemGuidePage from './pages/DesignSystemGuidePage';
import DesignSystemPage from './pages/DesignSystemPage';
import ComponentGenPage from './pages/ComponentGenPage';
import CodeGenPage from './pages/CodeGenPage';
import CursorMCPPage from './pages/CursorMCPPage';
import './App.css';

const { Header, Content, Sider } = Layout;



// 菜单选中状态组件
const MenuContainer: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // 获取当前路径对应的菜单key
  const getCurrentMenuKey = () => {
    const pathname = location.pathname;
    if (pathname === '/') return 'figma-mcp';
    const key = pathname.slice(1);
    // 处理路径映射
    if (key === 'cursor-mcp') return 'cursor-mcp';
    if (key === 'design-guide') return 'design-guide';
    if (key === 'design-system') return 'design-system';
    if (key === 'component') return 'component';
    if (key === 'code') return 'code';
    return 'figma-mcp'; // 默认选中
  };

  const menuItems = [
    {
      key: 'figma-mcp',
      icon: <ApiOutlined />,
      label: <Link to="/">Figma MCP</Link>
    },
    {
      key: 'cursor-mcp',
      icon: <ThunderboltOutlined />,
      label: <Link to="/cursor-mcp">Cursor MCP</Link>
    },
    {
      key: 'design-guide',
      icon: <BookOutlined />,
      label: <Link to="/design-guide">设计系统指南</Link>
    },
    {
      key: 'design-system',
      icon: <AppstoreOutlined />,
      label: <Link to="/design-system">设计规范</Link>
    },
    {
      key: 'component',
      icon: <FileOutlined />,
      label: <Link to="/component">组件生成</Link>
    },
    {
      key: 'code',
      icon: <CodeOutlined />,
      label: <Link to="/code">代码生成</Link>
    }
  ];

  return (
    <Sider 
      width={200} 
      className="site-layout-background"
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
    >
      <Menu
        mode="inline"
        selectedKeys={[getCurrentMenuKey()]}
        items={menuItems}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header">
          <div className="logo">
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            AutoKit
          </div>
        </Header>
        <Layout>
          <MenuContainer />
          <Layout style={{ padding: '24px' }}>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                borderRadius: 8,
                background: '#fff'
              }}
            >
              <Routes>
                <Route path="/" element={<FigmaMCPPage />} />
                <Route path="/cursor-mcp" element={<CursorMCPPage />} />
                <Route path="/design-guide" element={<DesignSystemGuidePage />} />
                <Route path="/design-system" element={<DesignSystemPage />} />
                <Route path="/component" element={<ComponentGenPage />} />
                <Route path="/code" element={<CodeGenPage />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;