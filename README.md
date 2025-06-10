# AutoKit设计系统自动化工具

## 项目简介
AutoKit是一款基于Cursor AI与Figma组件库的自动化设计系统工具，支持MCP配置、设计规范JSON生成、组件库扩展、Figma设计稿与前端代码自动生成，助力设计与开发高效协作。

## 主要功能
- MCP多平台配置管理
- 设计规范系统JSON自动生成
- 组件库智能扩展与文档生成
- Figma设计稿自动生成与审核
- 前端代码一键生成（React/Vue）

## 技术栈
- 前端：React/Vue.js
- 后端：Node.js
- 数据库：MongoDB/PostgreSQL
- 脚本语言：TypeScript
- 设计API：Figma API
- AI能力：Cursor AI API
- CI/CD：GitHub Actions、Jenkins

## 目录结构
```
/autokit
  /backend         # 后端服务
  /frontend        # 前端界面
  /scripts         # 自动化脚本
  /docs            # 项目文档
  /config          # 配置文件
```

## 功能特性

### Figma MCP集成
- 支持通过Figma MCP与Figma进行实时通信
- 自动提取Figma设计规范，包括颜色、排版、间距、效果和组件
- 执行Figma操作，如获取文档信息、获取选择、创建元素等
- 通过WebSocket与Figma插件进行实时通信

### 设计规范管理

## 快速开始

### 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install

# 安装Figma MCP
node scripts/install-figma-mcp.js
```

### 启动服务
```bash
# 启动前端开发服务器
cd frontend
npm run dev

# 启动后端服务器
cd ../backend
npm run dev

# 启动WebSocket服务器
npm run start-figma-socket
```

### 配置Figma插件
1. 打开Figma > 插件 > 开发 > 新建插件
2. 选择"链接现有插件"
3. 选择 `figma_plugin/manifest.json` 文件
4. 在Figma中启动插件，连接到WebSocket服务器

## 贡献指南
欢迎提交issue、PR和建议！

## License
MIT 