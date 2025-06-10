import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from 'antd/lib/layout';
import Menu from 'antd/lib/menu';
import {
  AppstoreOutlined,
  SettingOutlined,
  CodeOutlined,
  FileOutlined,
  ApiOutlined
} from '@ant-design/icons';

import FigmaMCPPage from './pages/FigmaMCPPage';
import './App.css';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header">
          <div className="logo">AutoKit</div>
        </Header>
        <Layout>
          <Sider width={200} className="site-layout-background">
            <Menu
              mode="inline"
              defaultSelectedKeys={['figma-mcp']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <Menu.Item key="figma-mcp" icon={<ApiOutlined />}>
                <Link to="/">Figma MCP</Link>
              </Menu.Item>
              <Menu.Item key="design-system" icon={<AppstoreOutlined />}>
                <Link to="/design-system">设计规范</Link>
              </Menu.Item>
              <Menu.Item key="component" icon={<FileOutlined />}>
                <Link to="/component">组件生成</Link>
              </Menu.Item>
              <Menu.Item key="code" icon={<CodeOutlined />}>
                <Link to="/code">代码生成</Link>
              </Menu.Item>
              <Menu.Item key="settings" icon={<SettingOutlined />}>
                <Link to="/settings">设置</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 24px 24px' }}>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              <Routes>
                <Route path="/" element={<FigmaMCPPage />} />
                <Route path="/design-system" element={<div>设计规范页面</div>} />
                <Route path="/component" element={<div>组件生成页面</div>} />
                <Route path="/code" element={<div>代码生成页面</div>} />
                <Route path="/settings" element={<div>设置页面</div>} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App; 