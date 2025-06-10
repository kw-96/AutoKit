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

## 2024-06-09 CursorMCP集成重构

1. 创建独立的CursorMCP模块：
   - 新增 backend/src/cursorMCP/ 目录，作为独立模块
   - 新增 backend/src/cursorMCP/types/index.ts，定义MCPConfig、MCPResponse等类型
   - 新增 backend/src/cursorMCP/services/mcpService.ts，实现CursorMCPService类
   - 新增 backend/src/cursorMCP/controllers/mcpController.ts，实现MCP配置CRUD和操作执行
   - 新增 backend/src/cursorMCP/utils/mcpUtils.ts，提供配置验证等工具函数
   - 新增 backend/src/cursorMCP/index.ts，作为模块入口导出API和服务

2. 后端集成：
   - 修改 backend/src/index.ts，引入CursorMCP模块并注册路由
   - 添加 /api/cursor-mcp 路由前缀，提供统一的API入口
   - 安装 axios 依赖，用于MCP服务与API通信

3. 前端集成：
   - 新增 frontend/src/services/cursorMCP/types.ts，定义前端使用的MCP类型
   - 新增 frontend/src/services/cursorMCP/mcpService.ts，实现前端MCP服务
   - 新增 frontend/src/components/cursorMCP/MCPConfigForm.tsx，实现MCP配置表单
   - 新增 frontend/src/components/cursorMCP/MCPConfigList.tsx，实现MCP配置列表
   - 新增 frontend/src/pages/CursorMCPPage.tsx，实现MCP管理页面
   - 修改 frontend/src/App.tsx，添加CursorMCP页面到导航菜单
   - 安装 axios 依赖，用于前端与后端API通信

4. 优化结构：
   - 采用模块化设计，将CursorMCP作为独立服务提供者
   - 实现更好的解耦和可维护性
   - 统一API接口和响应格式

## 2024-06-09 CursorMCP界面优化

1. 美化界面：
   - 新增 frontend/src/components/cursorMCP/MCPConfigForm.css，优化表单样式
   - 新增 frontend/src/components/cursorMCP/MCPConfigList.css，优化列表样式
   - 新增 frontend/src/pages/CursorMCPPage.css，优化页面整体样式
   - 统一使用蓝色主题，提升用户体验

2. 功能增强：
   - 新增 frontend/src/components/cursorMCP/MCPExecuteModal.tsx，实现MCP操作执行模态框
   - 新增 frontend/src/components/cursorMCP/MCPExecuteModal.css，定义模态框样式
   - 添加常用MCP操作快速选择功能，包括get_document_info、get_selection等
   - 优化操作执行结果展示，使用格式化JSON显示

3. 交互优化：
   - 替换简单的alert为模态框，提升用户体验
   - 添加表单验证，确保输入正确
   - 优化错误和成功提示样式
   - 添加操作执行结果的可视化展示 

## 2024-06-09 修复前端代码生成模块问题

1. 修复前端代码生成模块与CursorMCP集成问题：
   - 更新`frontend/src/pages/CodeGenPage.tsx`，使用CursorMCPService替代直接fetch调用
   - 修正API路径和类型定义，使用MCPConfig类型替代自定义McpConfig接口
   - 优化错误处理和提示信息
   - 添加MCP操作执行函数，支持通过CursorMCP执行代码生成和设计规范生成

2. 优化代码生成界面：
   - 新增`frontend/src/pages/CodeGenPage.css`样式文件
   - 优化代码预览区域样式
   - 统一界面风格与其他模块

3. 修复TypeScript类型错误：
   - 修正antd组件导入方式，使用单独导入解决类型问题
   - 修复Button、Form、Select等组件的类型错误
   - 优化组件属性和事件处理 

## 2024-06-09 修复和完善FigmaMCP集成

1. 修复后端集成问题：
   - 修复 `backend/src/app.ts` 中的导入错误，删除不存在的模块导入
   - 更新 `backend/src/index.ts`，添加WebSocket服务器启动逻辑
   - 创建 `backend/src/figmaMCP/socket.ts` WebSocket服务器，用于Figma MCP通信
   - 安装 `ws` 和 `@types/ws` 依赖，支持WebSocket通信

2. 完善前端集成：
   - 更新 `frontend/src/App.tsx`，使用React Router实现页面路由
   - 创建 `frontend/src/App.css`，美化应用界面
   - 更新 `frontend/src/main.tsx`，使用App组件作为入口点
   - 创建 `frontend/src/index.css`，添加全局样式
   - 安装 `react-router-dom` 和 `@types/react-router-dom` 依赖，支持前端路由

3. 解决类型问题：
   - 修复WebSocket错误处理的类型问题
   - 使用单独导入antd组件的方式解决类型冲突
   - 更新Menu组件的使用方式，解决子组件渲染问题

## 2023-XX-XX: 集成cursor-talk-to-figma-mcp

### 添加文件

1. `scripts/install-figma-mcp.js` - 安装脚本，用于安装和配置cursor-talk-to-figma-mcp
2. `backend/src/figmaMCP/index.ts` - FigmaMCP模块入口文件
3. `backend/src/figmaMCP/types/index.ts` - FigmaMCP类型定义
4. `backend/src/figmaMCP/services/figmaMcpService.ts` - FigmaMCP服务实现
5. `backend/src/figmaMCP/controllers/figmaMcpController.ts` - FigmaMCP控制器
6. `backend/src/figmaMCP/utils/figmaUtils.ts` - Figma工具函数
7. `frontend/src/services/figmaMCP/types.ts` - 前端FigmaMCP类型定义
8. `frontend/src/services/figmaMCP/figmaMcpService.ts` - 前端FigmaMCP服务
9. `frontend/src/components/figmaMCP/FigmaMCPConfigForm.tsx` - FigmaMCP配置表单组件
10. `frontend/src/components/figmaMCP/FigmaMCPConfigList.tsx` - FigmaMCP配置列表组件
11. `frontend/src/components/figmaMCP/FigmaDesignSpecView.tsx` - Figma设计规范视图组件
12. `frontend/src/components/figmaMCP/FigmaExecutePanel.tsx` - Figma执行面板组件
13. `frontend/src/pages/FigmaMCPPage.tsx` - FigmaMCP页面
14. 添加相关CSS样式文件

### 修改文件

1. `backend/src/app.ts` - 添加FigmaMCP路由

### 功能实现

1. 集成cursor-talk-to-figma-mcp，实现Cursor和Figma数据打通
2. 实现FigmaMCP配置管理功能
3. 实现设计规范自动提取功能
4. 实现Figma操作执行功能
5. 实现Figma WebSocket通信功能

### 主要功能

1. **FigmaMCP配置管理**：创建、编辑、删除FigmaMCP配置
2. **设计规范提取**：从Figma文件中自动提取颜色、排版、间距、效果和组件等设计规范
3. **Figma操作执行**：执行各种Figma操作，如获取文档信息、获取选择、创建元素等
4. **WebSocket通信**：通过WebSocket与Figma插件进行实时通信 

## 2024-06-09 FigmaMCP集成总结

完成了FigmaMCP集成的主要工作，实现了Cursor与Figma的数据打通。主要成果包括：

1. 后端集成：
   - 创建了FigmaMCP模块，包含类型定义、服务、控制器和工具函数
   - 实现了WebSocket服务器，支持与Figma插件的实时通信
   - 实现了设计规范提取功能，可以从Figma文件中提取颜色、排版、间距、效果和组件

2. 前端集成：
   - 创建了FigmaMCP页面和相关组件，包括配置表单、配置列表、设计规范视图和执行面板
   - 实现了前端服务，与后端API交互
   - 使用React Router实现页面路由

3. 工具支持：
   - 创建了安装脚本，用于安装和配置cursor-talk-to-figma-mcp
   - 添加了WebSocket服务器启动脚本

4. 文档更新：
   - 更新了README.md，添加了FigmaMCP相关内容
   - 更新了log.md，记录了修改历史

下一步计划：
1. 完善Figma插件，支持更多设计操作
2. 优化设计规范提取算法，提高准确性
3. 实现设计规范到代码的自动转换
4. 添加更多单元测试和集成测试 

## 2024-06-10 修复FigmaMCP安装脚本

1. 修复安装脚本中的仓库URL问题：
   - 将原来不存在的仓库URL `https://github.com/cursor-ai/talk-to-figma-mcp.git` 更新为正确的URL `https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git`
   - 更新相应的仓库目录名称，从 `talk-to-figma-mcp` 改为 `cursor-talk-to-figma-mcp`
   - 成功克隆仓库并安装依赖
   - 成功复制必要文件到项目目录

2. 修复安装脚本中的路径编码问题：
   - 添加检查并删除已存在仓库目录的逻辑，避免重复克隆失败
   - 使用绝对路径并移除中文字符，解决MCP配置文件中的路径编码问题
   - 成功更新MCP配置文件，确保Cursor可以正确找到并启动MCP服务器

3. 验证安装结果：
   - 源码文件已成功复制到 `backend/src/figmaMCP/talk_to_figma_mcp` 目录
   - Figma插件已成功复制到 `figma_plugin` 目录
   - WebSocket服务器已成功复制到 `backend/src/figmaMCP/socket.ts`
   - MCP配置文件已成功创建，使用英文路径避免编码问题
   - 启动脚本已成功添加到package.json 

## 2024-06-10 完善FigmaMCP集成

1. 添加WebSocket服务器启动脚本：
   - 在backend/package.json中添加`start-figma-socket`脚本，方便从backend目录启动WebSocket服务器
   - 添加`figma-mcp`脚本，用于启动FigmaMCP服务器

2. 创建FigmaMCP使用文档：
   - 新增`docs/figma-mcp-guide.md`，详细说明FigmaMCP的安装、配置和使用方法
   - 文档包含启动服务、配置Figma插件、在Cursor中使用等完整指南
   - 提供了常用命令的参考和示例用法

3. 实现一键启动所有服务的脚本：
   - 创建`scripts/start-all.js`，可同时启动后端服务、WebSocket服务器和前端服务
   - 使用不同颜色区分不同服务的输出，提高可读性
   - 添加进程退出处理，确保所有服务可以正常关闭
   - 在根目录package.json中添加`start-all`脚本，方便一键启动 

## 2024-06-10 修复FigmaMCP类型错误和启动问题

1. 修复WebSocket服务器启动问题：
   - 修改backend/package.json中的`start-figma-socket`脚本，使用bun而不是ts-node运行
   - 修改scripts/start-all.js中的WebSocket服务器启动命令，直接使用bun运行socket.ts
   - 解决了ts-node无法处理bun特定导入的问题

2. 添加缺失的类型定义：
   - 创建`backend/src/figmaMCP/types/tokens.ts`，定义了FigmaColorToken、FigmaTypographyToken等类型
   - 确保新类型与现有的index.ts中的类型定义兼容
   - 添加了必要的属性，如id、nodeId、key等

3. 修复类型错误：
   - 修改FigmaMCPService中的messageQueue类型定义，使用具体的函数类型替代Function
   - 修复Promise回调类型问题，确保类型兼容
   - 导入新创建的类型，解决了"找不到名称"的错误

## 2024-06-10 修复FigmaMCP端口冲突问题

1. 解决WebSocket服务器端口冲突：
   - 发现在scripts/start-all.js中同时启动了两个使用相同端口(3055)的WebSocket服务器
   - 一个通过`bun run backend/src/figmaMCP/socket.ts`单独启动
   - 另一个在后端服务`ts-node src/index.ts`中自动启动
   - 修改scripts/start-all.js，移除WebSocket服务器的单独启动，避免端口冲突
   - 保留后端服务中的WebSocket服务器启动，确保功能完整性

2. 优化启动流程：
   - 简化了一键启动脚本，只启动必要的服务
   - 减少了资源占用和启动时间
   - 确保服务之间不会相互干扰

## 2024-06-11 增强start-all脚本，支持端口管理和自动清理

1. 增加端口检查和清理功能：
   - 新增`isPortInUse`函数，检查端口是否被占用
   - 新增`freePort`函数，自动终止占用端口的进程
   - 支持Windows和Linux/macOS平台
   - 添加重试机制，确保端口释放成功

2. 固定服务端口配置：
   - 后端服务固定使用3001端口
   - 前端服务固定使用5173端口
   - WebSocket服务器固定使用3055端口
   - 通过环境变量传递端口配置

3. 改进服务启动方式：
   - 使用环境变量传递端口配置
   - 前端服务使用`--port`参数指定端口
   - 后端服务和WebSocket服务器通过环境变量获取端口

4. 修改相关服务代码：
   - 更新`backend/src/figmaMCP/socket.ts`，使用环境变量中的端口
   - 更新`backend/src/index.ts`，在日志中显示WebSocket服务器端口
   - 更新`backend/src/figmaMCP/services/figmaMcpService.ts`，使用环境变量中的端口
   - 更新`figma_plugin/ui.html`，设置默认WebSocket端口为3055 

## 2024-06-11 修复MongoDB连接问题

1. 优化MongoDB连接逻辑：
   - 修改`backend/src/db/mongo.ts`中的连接流程
   - 添加环境变量`USE_MEMORY_DB`控制是否默认使用内存数据库
   - 实现更健壮的连接失败处理逻辑，确保服务不会因数据库连接失败而中断
   - 优化日志输出，提供更清晰的连接状态信息

2. 连接策略改进：
   - 首先检查是否设置了环境变量，决定是否直接使用内存数据库
   - 如果配置了MongoDB URI，尝试连接指定的数据库
   - 如果没有配置URI，尝试连接本地MongoDB
   - 所有连接尝试失败后，自动退回到内存数据库作为后备方案
   - 添加更详细的错误处理和日志记录 

## 2023-11-10 Figma插件固定通道ID功能

### 修改内容

1. 修改了Figma插件UI，添加了通道ID输入框
   - 添加了保存通道ID的功能
   - 使用localStorage存储通道ID，保证重启后仍然可用
   - 添加了通知提示功能

2. 修改了WebSocket连接逻辑
   - 使用固定通道ID替代随机生成的ID
   - 优化了连接状态显示

3. 更新了前端FigmaMCPConfigForm组件
   - 突出显示通道ID设置字段
   - 添加了使用固定通道ID的提示说明
   - 改进了用户界面的友好性

### 优势

1. 提高了连接稳定性：使用固定通道ID可以确保每次连接到同一通道
2. 简化了用户操作：用户只需设置一次通道ID，后续无需重复设置
3. 改进了调试体验：固定的通道ID便于追踪连接问题
4. 增强了用户体验：添加了更多提示和帮助信息

### 使用方法

1. 在Figma插件中设置固定通道ID（如"autokit"）
2. 在AutoKit前端配置中使用相同的通道ID
3. 连接时，两端将自动使用相同的通道ID建立连接 

## 2023年6月11日

### Figma插件配置检查

检查了前端和后端代码中关于Figma文件ID和团队ID的配置，结果如下：

1. 前端配置表单 (`frontend/src/components/figmaMCP/FigmaMCPConfigForm.tsx`) 中的字段定义：
   - `fileId`: Figma文件ID，有正确的Tooltip提示："从Figma文件URL中获取，格式如：https://www.figma.com/file/XXXX/，其中XXXX部分即为文件ID"
   - `teamId`: Figma团队ID，简单标记为"Figma团队ID（可选）"

2. 前端类型定义 (`frontend/src/services/figmaMCP/types.ts`) 中的接口定义：
   ```typescript
   export interface MCPConfig {
     // ...
     fileId?: string;
     teamId?: string;
     // ...
   }
   ```

3. 后端类型定义 (`backend/src/figmaMCP/types/index.ts`) 中的接口定义：
   ```typescript
   export interface FigmaMCPConfig {
     // ...
     fileId?: string;  // Figma文件ID
     teamId?: string;  // Figma团队ID
     // ...
   }
   ```

4. 后端服务 (`backend/src/figmaMCP/services/figmaMcpService.ts`) 中的使用：
   - `getFigmaFile` 方法正确使用 `fileId` 参数访问Figma API

**结论**：经过检查，前端和后端代码中对Figma文件ID和团队ID的定义和使用都是一致的，没有混淆。两个字段的命名和用途符合预期：
- `fileId`: 用于指定要操作的Figma文件
- `teamId`: 用于指定Figma团队

**建议**：可以为团队ID字段添加更详细的Tooltip说明，类似于文件ID的提示，以便用户更清楚地了解如何获取和使用团队ID。 