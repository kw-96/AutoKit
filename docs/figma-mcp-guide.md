# FigmaMCP 使用指南

## 简介

FigmaMCP是AutoKit的一个关键组件，它允许Cursor AI与Figma进行通信，使得Cursor可以读取Figma设计并对其进行编程修改。这个集成基于Model Context Protocol (MCP)，使AI能够直接与设计工具交互。

## 安装

FigmaMCP的安装已经通过`scripts/install-figma-mcp.js`脚本自动化。这个脚本会：

1. 克隆必要的仓库
2. 安装依赖
3. 复制必要的文件到项目中
4. 配置MCP设置
5. 添加启动脚本

如果你需要重新安装，只需运行：

```bash
node scripts/install-figma-mcp.js
```

## 启动服务

### 启动WebSocket服务器

WebSocket服务器是FigmaMCP的核心组件，它负责在Cursor AI和Figma插件之间传递消息。要启动WebSocket服务器，请运行：

```bash
# 从项目根目录
npm run start-figma-socket

# 或者从backend目录
cd backend
npm run start-figma-socket
```

WebSocket服务器将在端口3055上运行。

### 配置Figma插件

1. 打开Figma
2. 进入菜单：插件 > 开发 > 新建插件
3. 选择"链接现有插件"
4. 选择项目中的`figma_plugin/manifest.json`文件
5. 插件将出现在你的开发插件列表中

### 在Figma中使用插件

1. 在Figma中，打开一个设计文件
2. 运行"Cursor MCP Plugin"
3. 在插件界面中，点击"Join Channel"按钮
4. 复制生成的Channel ID

### 在Cursor中使用FigmaMCP

1. 确保WebSocket服务器正在运行
2. 打开Cursor
3. 在聊天中输入：`Talk to Figma, channel {你的Channel ID}`
4. 现在Cursor可以与Figma通信了

## 可用命令

FigmaMCP提供了许多命令，允许Cursor与Figma交互。以下是一些常用命令：

### 文档和选择

- `get_document_info` - 获取当前Figma文档的信息
- `get_selection` - 获取当前选择的信息
- `get_node_info` - 获取特定节点的详细信息

### 创建元素

- `create_rectangle` - 创建一个新的矩形
- `create_frame` - 创建一个新的框架
- `create_text` - 创建一个新的文本节点

### 样式设置

- `set_fill_color` - 设置节点的填充颜色
- `set_stroke_color` - 设置节点的描边颜色
- `set_corner_radius` - 设置节点的圆角半径

### 布局和组织

- `move_node` - 移动节点到新位置
- `resize_node` - 调整节点大小
- `delete_node` - 删除节点

### 组件和样式

- `get_styles` - 获取本地样式信息
- `get_local_components` - 获取本地组件信息
- `create_component_instance` - 创建组件实例

## 示例用法

以下是一些使用FigmaMCP的示例：

### 获取文档信息

```
Talk to Figma, channel abc123
Get information about the current document.
```

### 创建一个简单的UI

```
Talk to Figma, channel abc123
Create a login form with username and password fields, and a submit button.
```

### 修改现有元素

```
Talk to Figma, channel abc123
Select the button and change its color to blue.
```

## 故障排除

如果你遇到问题，请检查以下几点：

1. 确保WebSocket服务器正在运行
2. 确保你已经在Figma中运行了插件并加入了通道
3. 确保你在Cursor中使用了正确的通道ID
4. 检查控制台输出是否有错误信息

## 高级用法

### 自定义MCP配置

MCP配置文件位于`~/.cursor/mcp.json`。如果你需要自定义配置，可以直接编辑这个文件。

### 开发自定义命令

如果你想添加新的命令或修改现有命令，可以编辑`backend/src/figmaMCP/talk_to_figma_mcp`目录中的文件。 