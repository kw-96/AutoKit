# AutoKit 设计系统自动化工具

## 项目简介
AutoKit 是一款面向设计师与前端开发者的设计系统自动化平台，支持基于 Figma 组件库和 Cursor AI，实现设计规范、组件、设计稿、前端代码的自动生成与管理，极大提升团队协作效率和产品一致性。

## 系统架构
- 前端：React + Ant Design，交互友好，支持多页面切换
- 后端：Node.js + Express + TypeScript，API标准化，支持MongoDB持久化
- 数据库：MongoDB
- 设计API：Figma API
- AI能力：Cursor AI（由Cursor侧实现，后端仅做数据中转）

## 快速上手
### 1. 环境准备
- Node.js 16+
- MongoDB 4+
- Figma账号与API Key

### 2. 安装依赖
```bash
npm install
```

### 3. 启动服务
```bash
# 启动后端
cd backend && npm run dev
# 启动前端
cd frontend && npm run dev
```

### 4. 访问系统
- 前端界面：http://localhost:5173
- 后端API文档：http://localhost:3001/api-docs

### 5. 典型流程
1. 登录前端，进入"MCP配置管理"，添加Figma MCP配置（填写API Key）
2. 进入"设计规范系统"，输入Figma组件库ID和API Key，自动生成设计规范JSON
3. 进入"组件生成"，输入组件名、类型等，自动生成组件结构
4. 进入"设计稿生成"，输入页面需求，自动生成设计稿数据
5. 进入"前端代码生成"，输入组件名、props等，自动生成代码

## 主要功能导航
- MCP配置管理：多平台API Key与配置管理，支持Figma/AI等
- 设计规范系统：自动提取Figma设计规范，生成JSON并持久化
- 组件生成：基于Figma/AI能力自动生成组件结构与属性
- 设计稿生成：根据需求描述自动生成页面级设计稿
- 前端代码生成：一键生成React/Vue等主流前端代码
- 数据持久化：所有核心数据均存储于MongoDB，支持后续扩展
- API文档：Swagger自动生成，便于二次开发与对接

## 相关文档
- [使用指引 usage.md](./usage.md)
- [MCP/密钥配置 config.md](./config.md)
- [常见问题 faq.md](./faq.md)
- [开发与部署 dev.md](./dev.md)
- [安全与备份 security.md](./security.md) 