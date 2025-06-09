# AutoKit 开发与部署（dev.md）

## 1. 本地开发环境搭建
- Node.js 16 及以上
- MongoDB 4 及以上
- 推荐 VSCode 编辑器
- Figma API Key（用于测试设计相关功能）

## 2. 目录结构说明
```
/autokit
  /backend      # 后端服务（Node.js + Express + TypeScript）
  /frontend     # 前端项目（React + Vite + Ant Design）
  /docs         # 项目文档
  /config       # 配置文件
  /scripts      # 辅助脚本
```

## 3. 环境变量配置
- 后端环境变量示例（.env）：
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/autokit
FIGMA_API_KEY=xxx
```
- 前端如需API地址自定义，可在`vite.config.ts`或`.env`中配置：
```
VITE_API_BASE_URL=http://localhost:3001
```

## 4. 数据库初始化
1. 启动本地MongoDB服务
2. 后端首次运行时会自动创建所需集合

## 5. 前后端启动
```bash
# 启动后端
cd backend
npm install
npm run dev

# 启动前端
cd ../frontend
npm install
npm run dev
```
- 前端默认端口：5173
- 后端默认端口：3001

## 6. 常用开发命令
- 后端：
  - `npm run dev`  # 启动开发模式（支持热更新）
  - `npm run build`  # 构建生产包
  - `npm run lint`  # 代码检查
- 前端：
  - `npm run dev`  # 启动开发模式
  - `npm run build`  # 构建生产包

## 7. 调试与热更新
- 后端已集成`ts-node-dev`，代码变更自动重启
- 前端Vite支持热更新，保存后自动刷新页面

## 8. CI/CD建议
- 推荐使用GitHub Actions或Jenkins实现自动化测试与部署
- 关键流程：代码拉取 → 依赖安装 → 代码检查 → 单元测试 → 构建 → 部署
- 可配置自动备份MongoDB数据

## 9. 常见开发问题与排查
- **端口被占用**：修改.env或配置文件中的端口号
- **MongoDB连接失败**：检查数据库服务是否启动，URI是否正确
- **依赖安装失败**：尝试删除`node_modules`和`package-lock.json`后重新安装
- **前后端跨域问题**：后端已开启CORS，若有特殊需求可调整CORS配置
- **API Key泄露风险**：请勿将密钥提交到Git仓库，使用.env文件管理

如遇更多开发相关问题，请参考[常见问题 faq.md](./faq.md)或联系维护者。 