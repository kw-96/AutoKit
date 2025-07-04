# AutoKit - AI Talk to Figma

## 项目简介

本项目基于 cursor to figma mcp 项目二次开发，实现了 AI助手 与 Figma 之间的模型上下文协议（Model Context Protocol，MCP）集成，使 AI助手 能够与 Figma 进行通信，实现对设计稿的读取和程序化修改。

---

## 功能特性

- 🚀 一键启动：自动检查环境、安装依赖、构建项目、启动服务
- 🔧 环境配置：自动检查和配置运行环境
- 📦 依赖管理：支持 Bun 和 npm 双重依赖管理
- 🔗 MCP 集成：自动配置 MCP 连接
- 🎨 Figma 插件：完整的 Figma 插件支持
- 📊 实时监控：服务状态实时显示和日志输出
- 🔄 设计自动化：批量文本替换、组件实例覆盖等高级功能
- 📝 标注系统：支持 Markdown 格式的标注管理
- 🎯 原型交互：原型流程可视化和连接器管理

---

## 项目结构

```
AutoKit/
├── start-all.js          # 主启动脚本
├── check-env.js          # 环境检查脚本
├── package.json          # 根目录配置
└── AI-talk-to-figma-mcp/
    ├── src/
    │   ├── talk_to_figma_mcp/
    │   │   └── server.ts     # MCP 服务器
    │   ├── socket.ts         # WebSocket 服务器
    │   └── AI_mcp_plugin/
    │       ├── code.js       # Figma 插件代码
    │       ├── manifest.json # 插件配置
    │       └── ui.html       # 插件界面
    ├── package.json
    └── tsconfig.json
```

---

## 环境要求

**必需：**
- Node.js >= 16.0.0
- npm（随 Node.js 安装）
- 操作系统：Windows 10/11, macOS, Linux
- Bun（https://bun.sh/）

**推荐：**
- AI助手（AI 代码编辑器）

---

## 快速开始

1. **环境检查**
   ```bash
   npm run check-env
   # 或
   npm run env
   ```
2. **安装 Bun**
   ```bash
   # Windows (PowerShell)
   irm bun.sh/install.ps1|iex
   # macOS/Linux
   curl -fsSL https://bun.sh/install | bash
   ```
3. **启动服务**
   ```bash
   bun setup
   bun socket
   bunx AI-talk-to-figma-mcp
   # 或一键启动
   npm start
   # 或
   node start-all.js
   ```
4. **安装 Figma 插件**
   - Figma > 插件 > 开发 > 新建插件 > 链接现有插件
   - 选择 `src/AI_mcp_plugin/manifest.json`
5. **连接服务**
   - 启动 WebSocket 服务器
   - 在 AI助手 中安装 MCP 服务器
   - 打开 Figma 并运行 MCP 插件
   - 使用 `join_channel` 连接插件到 WebSocket 服务器
   - 使用 AI助手 通过 MCP 工具与 Figma 进行通信

---

## 设计自动化示例

- **批量文本内容替换**：感谢 [@dusskapark](https://github.com/dusskapark) 贡献，[演示视频](https://www.youtube.com/watch?v=j05gGT3xfCs)
- **组件实例覆盖属性传播**：同样感谢 [@dusskapark](https://github.com/dusskapark)，[演示视频](https://youtu.be/uvuT8LByroI)

---

## 使用方法

1. 启动 WebSocket 服务器
2. 在 AI助手 中安装 MCP 服务器
3. 打开 Figma 并运行 MCP 插件
4. 使用 `join_channel` 连接插件到 WebSocket 服务器
5. 使用 AI助手 通过 MCP 工具与 Figma 进行通信

---

## 手动安装与配置

### MCP 服务器
在 `~/.cursor/mcp.json` 中添加：
```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "bunx",
      "args": ["ai-talk-to-figma-mcp@latest"]
    }
  }
}
```
### WebSocket 服务器
```bash
bun socket
```
### Figma 插件
- Figma > 插件 > 开发 > 新建插件 > 链接现有插件
- 选择 `src/AI_mcp_plugin/manifest.json`

---

## Windows + WSL 指南

- PowerShell 安装 bun：
  ```bash
  powershell -c "irm bun.sh/install.ps1|iex"
  ```
- `src/socket.ts` 取消注释 hostname `0.0.0.0`：
  ```typescript
  hostname: "0.0.0.0",
  ```
- 启动 WebSocket：
  ```bash
  bun socket
  ```

---

## MCP 工具功能

### 文档与选择
- `get_document_info` 获取文档信息
- `get_selection` 获取当前选择
- `read_my_design` 获取当前选择详细节点信息
- `get_node_info` 获取特定节点详细信息
- `get_nodes_info` 批量获取多个节点详细信息

### 标注系统
- `get_annotations` 获取所有标注
- `set_annotation` 创建/更新 markdown 标注
- `set_multiple_annotations` 批量创建/更新标注
- `scan_nodes_by_types` 扫描特定类型节点

### 原型与连接
- `get_reactions` 获取节点原型反应
- `set_default_connector` 设置默认连接器样式
- `create_connections` 创建 FigJam 连接线

### 元素创建与编辑
- `create_rectangle` 创建矩形
- `create_frame` 创建画框
- `create_text` 创建文本节点

### 文本内容修改
- `scan_text_nodes` 智能分块扫描文本节点
- `set_text_content` 设置单个文本节点内容
- `set_multiple_text_contents` 批量更新文本节点

### 自动布局与间距
- `set_layout_mode` 设置布局模式
- `set_padding` 设置内边距
- `set_axis_align` 设置对齐方式
- `set_layout_sizing` 设置尺寸模式
- `set_item_spacing` 设置子元素间距

### 样式与外观
- `set_fill_color` 设置填充色
- `set_stroke_color` 设置描边色和粗细
- `set_corner_radius` 设置圆角

### 布局与组织
- `move_node` 移动节点
- `resize_node` 调整节点大小
- `delete_node` 删除节点
- `delete_multiple_nodes` 批量删除节点
- `clone_node` 克隆节点

### 组件与样式
- `get_styles` 获取本地样式
- `get_local_components` 获取本地组件
- `create_component_instance` 创建组件实例
- `get_instance_overrides` 提取组件实例覆盖属性
- `set_instance_overrides` 应用覆盖属性

### 导出功能
- `export_node_as_image` 节点导出为图片

### 连接管理
- `join_channel` 加入频道

### MCP 提示
- `design_strategy` Figma 设计最佳实践
- `read_design_strategy` 读取设计最佳实践
- `text_replacement_strategy` 文本替换方法
- `annotation_conversion_strategy` 标注转换策略
- `swap_overrides_instances` 组件实例属性传递
- `reaction_to_connector_strategy` 原型转连接线策略

---

## 最佳实践

1. 发送命令前先加入频道
2. 使用 `get_document_info` 获取文档概览
3. 修改前用 `get_selection` 检查选择
4. 按需使用 `create_frame`/`create_rectangle`/`create_text`
5. 用 `get_node_info` 验证更改
6. 优先用组件实例
7. 所有命令注意异常处理
8. 大型设计用分块、WebSocket 监控进度
9. 文本操作优先批量，注意结构关系
10. 旧版标注转换：
    - 扫描文本节点识别编号标记
    - `scan_nodes_by_types` 查找目标
    - 路径/名称/距离匹配目标
    - `get_annotations` 分类标注
    - `set_multiple_annotations` 批量创建
    - 验证标注链接
    - 删除旧标注节点
11. 原型连线可视化：
    - `get_reactions` 提取流程
    - `set_default_connector` 设置默认
    - `create_connections` 生成连接线

---

## 故障排除

### 常见问题

- **MCP 列表无 TalkToFigma**
  1. 检查 MCP 配置文件
  2. 重启 AI助手 编辑器
  3. `Ctrl+Shift+P` 搜索 "MCP"
- **端口占用**
  ```bash
  netstat -ano | findstr :3055
  taskkill /PID <PID> /F
  ```
- **获取帮助**
  1. 运行 `npm run check-env`
  2. 查看控制台错误
  3. 检查网络
  4. 重启 AI助手 编辑器

---

## 开发与扩展

### 构建 Figma 插件

1. 进入插件目录：
   ```bash
   cd src/AI_mcp_plugin
   ```
2. 编辑 `code.js` 和 `ui.html`

---

## 许可证

MIT License

---

**AutoKit - 让 AI 与设计工具无缝协作 🚀** 