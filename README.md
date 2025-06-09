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

## 快速开始
1. 克隆仓库
   ```bash
   git clone <your-repo-url> autokit
   cd autokit
   ```
2. 安装依赖
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. 配置环境变量和API密钥
   - 参考`/config`目录下的示例配置文件
4. 启动开发环境
   ```bash
   cd backend && npm run dev
   cd ../frontend && npm run dev
   ```

## 贡献指南
欢迎提交issue、PR和建议！

## License
MIT 