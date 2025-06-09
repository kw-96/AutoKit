# 修改日志

## 2024-03-26
### 新增
1. 创建项目需求文档 `requirement-doc.md`
   - 详细描述了AutoKit设计系统自动化工具的项目需求
   - 包含项目概述、功能需求、非功能需求、技术规格和交付物等完整内容
   - 设定了具体的项目里程碑和时间线
   - 制定了明确的验收标准 

### 优化
1. 优化项目需求文档 `requirement-doc.md`
   - 项目目标增加量化指标
   - 用户流程增加Mermaid流程图
   - 功能详细描述补充典型场景举例
   - 非功能需求细化性能、安全、可用性要求
   - 技术规格补充数据库、CI/CD、架构图说明
   - 交付物细化里程碑、时间线和验收标准
   - 新增术语表，解释MCP、FigmaMCP等专业术语
2. 在项目需求文档 `requirement-doc.md` 中详细引用了MCP工具（/f/mcptools）官方资料：
   - 安装与配置命令
   - 项目创建、工具注册、代理启动命令
   - 工具调用、交互式Shell、权限安全命令
   - 相关官方文档链接和术语表补充 

### 仓库初始化
1. 创建README.md，包含项目简介、目录结构、主要功能、技术栈、快速开始等内容
2. 创建.gitignore，忽略Node、前端、数据库、环境配置等常见文件
3. 在config目录下添加.gitkeep，确保空目录被git跟踪
4. 在docs目录下添加README.md，说明文档用途和结构 

### 脚手架搭建
1. 创建backend目录及README.md、package.json、tsconfig.json、src/index.ts等文件，实现基础Express服务
2. 创建frontend目录及README.md、package.json、tsconfig.json、src/main.tsx等文件，实现基础React页面 

3. 生成后端MCP配置管理API（src/models/mcpConfig.ts, src/routes/mcpConfig.ts），支持增删查改
4. 生成前端MCP配置管理页面（src/pages/McpConfigPage.tsx, src/components/McpConfigForm.tsx），支持新增和列表展示
5. main.tsx渲染McpConfigPage为主页面 

6. 新增后端设计规范API（src/routes/designSystem.ts），POST /api/design-system，返回模拟设计规范JSON
7. 挂载设计规范API到index.ts
8. 新建前端设计规范系统页面（src/pages/DesignSystemPage.tsx），支持输入Figma库ID并展示JSON
9. 新建App.tsx，包含顶部导航和页面切换
10. main.tsx入口渲染App组件 

11. 新增后端组件生成API（src/routes/component.ts），POST /api/component，返回模拟组件数据
12. 挂载组件生成API到index.ts
13. 新建前端组件生成页面（src/pages/ComponentGenPage.tsx），支持输入组件需求并展示结果
14. App.tsx导航栏和页面切换加入组件生成入口 

15. 新增后端设计稿生成API（src/routes/design.ts），POST /api/design，返回模拟Figma设计稿数据
16. 挂载设计稿生成API到index.ts
17. 新建前端设计稿生成页面（src/pages/DesignGenPage.tsx），支持输入页面需求并展示结果
18. App.tsx导航栏和页面切换加入设计稿生成入口 

19. 新增后端前端代码生成API（src/routes/code.ts），POST /api/code，返回模拟React/Vue组件代码
20. 挂载前端代码生成API到index.ts
21. 新建前端代码生成页面（src/pages/CodeGenPage.tsx），支持输入组件名、props、框架等并展示代码
22. App.tsx导航栏和页面切换加入前端代码生成入口 

23. 后端引入CORS中间件，支持前后端分离开发 

24. 所有后端API（MCP配置、组件生成、设计规范、设计稿、代码生成）均补全参数校验和标准化错误响应，提升健壮性 

25. MCP配置数据持久化：实现fileStore工具，mcpConfig模型和API全部基于mcp-config.json文件读写，服务重启后数据不丢失 

- 重构 frontend/src/components/McpConfigForm.tsx，使用Ant Design Form组件替换原有表单，提升界面美观性和交互体验。
- 通过npm安装了antd和@types/antd依赖，解决类型声明和UI库依赖问题。
- 修复Ant Design样式引入报错，重新安装antd最新版，确认node_modules/antd/dist/reset.css文件已存在，前端可正常引入。
- 将设计规范系统、组件生成、设计稿生成、前端代码生成等主要页面的表单和交互全部重构为Ant Design组件，统一UI风格，提升用户体验。
- 将MCP配置管理页面的配置列表部分重构为Ant Design的List、Button、Popconfirm等组件，提升美观性和交互体验。并确保antd所有子组件完整可用。
- 重构全局布局为Ant Design的Layout和Menu侧边栏导航，顶部标题区，内容区块，自动适配现有各功能页面。并安装@ant-design/icons确保图标可用。
- 新增通用参数校验中间件（middleware/validate.ts）、全局错误处理中间件（middleware/errorHandler.ts），并引入joi依赖为后端API参数校验做准备。
- 为MCP配置相关API增加Joi参数校验和标准化错误处理，并安装uuid及其类型声明。
- 为设计规范系统、组件生成、设计稿生成、前端代码生成等API增加Joi参数校验和标准化错误处理，并在后端目录下安装joi依赖。
- 集成swagger-ui-express和swagger-jsdoc，自动生成并提供OpenAPI接口文档（/api-docs），并安装相关类型声明。
- 为MCP配置相关API补充Swagger注释，接口文档自动生成更详细。
- 新建Figma API服务（services/figma.ts），支持通过API Key拉取Figma文件、组件库、样式等数据，并安装node-fetch及其类型声明。
- 将设计规范、组件、设计稿等数据新增操作全部持久化到MongoDB，分别新建了DesignSystemModel、ComponentModel、DesignGenModel。 

## 2024-06-09
- 新增 docs/README.md 首页，内容包括：项目简介、系统架构、快速上手指引、主要功能导航及相关文档索引，便于新用户快速了解和使用AutoKit设计系统自动化工具。
- 新增 docs/usage.md，内容包括典型用户流程、主要界面说明、常见操作步骤、操作截图建议位、常见报错与处理建议，便于新用户快速上手和排查常见问题。
- 新增 docs/config.md，内容包括MCP配置（Figma/AI）、API Key获取与管理、配置验证、常见配置问题与排查、配置导入导出说明，便于用户正确配置和管理平台密钥。
- 新增 docs/faq.md，内容包括安装与环境、配置与密钥、功能使用、数据安全、前后端联调、常见报错与解决方案、技术支持方式，便于用户自助排查和获取帮助。
- 新增 docs/dev.md，内容包括本地开发环境搭建、目录结构说明、环境变量配置、数据库初始化、前后端启动、常用开发命令、调试与热更新、CI/CD建议、常见开发问题与排查，便于开发者快速上手和维护项目。
- 新增 docs/security.md，内容包括API Key与密钥管理、权限与访问控制、数据加密与传输安全、数据库备份与恢复、常见安全风险与防护建议、合规与隐私说明，便于用户和开发者保障系统安全与数据合规。
- 新增 start-all.bat，支持Windows下在根目录一键启动前后端开发服务，分别在新窗口自动进入backend和frontend目录并执行npm run dev，便于本地开发调试。
- 新增 start-all.sh，支持macOS/Linux下在根目录一键启动前后端开发服务，分别在新终端窗口自动进入backend和frontend目录并执行npm run dev，便于本地开发调试。

## 2024-06-09 MCP配置本地文件持久化

1. 修改 backend/src/models/mcpConfig.ts：
   - 新增loadFromFile/saveToFile方法，所有配置读写都落盘到config/mcp-config.json。
   - getMcpConfigs/ saveMcpConfigs 统一读写文件，重启服务后数据不丢失。
2. 修改 backend/src/routes/mcpConfig.ts：
   - 增删改查全部通过getMcpConfigs/saveMcpConfigs操作，保证数据持久化。
   - 新增/编辑/删除后返回最新配置数组。
3. 新增 config/mcp-config.json 文件，初始内容为[]，用于存储MCP配置。 