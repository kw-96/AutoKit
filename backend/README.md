# AutoKit 后端服务

本目录为AutoKit项目的后端服务，负责API接口、MCP配置管理、设计规范解析、组件与代码生成等核心逻辑。

## 技术栈
- Node.js
- TypeScript
- Express（可后续替换为NestJS等）
- MongoDB/PostgreSQL

## 启动方式
1. 安装依赖
   ```bash
   npm install
   ```
2. 启动开发环境
   ```bash
   npm run dev
   ```

## 目录结构
```
/src         # 主要业务代码
/config      # 配置文件
/scripts     # 自动化脚本
```

## 主要依赖
- typescript
- ts-node
- express
- @types/node

## 说明
- 入口文件：src/index.ts
- 配置文件示例见/config 