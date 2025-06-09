# AutoKit 配置说明（config.md）

## 1. MCP配置概述
AutoKit 支持多平台（MCP）配置，目前主要包括 Figma MCP 和 AI（Cursor）MCP。每个平台均需配置对应的 API Key 以实现数据拉取与自动化。

## 2. Figma MCP配置
### 2.1 获取Figma API Key
1. 登录 [Figma官网](https://www.figma.com/)
2. 点击右上角头像 → Settings → Personal access tokens
3. 生成新Token，复制保存

### 2.2 添加Figma MCP配置
1. 进入"MCP配置管理"页面
2. 点击"新增配置"
3. 选择平台类型为Figma，填写API Key
4. 点击"验证"按钮，验证通过后保存

### 2.3 Figma组件库ID获取
- 打开Figma组件库页面，浏览器地址栏URL中`file/`后的一串字符即为组件库ID
  例如：https://www.figma.com/file/`xxxxxx`/xxx

## 3. AI（Cursor）MCP配置
- 目前AI能力由Cursor侧实现，后端仅做数据中转，若需配置AI相关参数，可在"MCP配置管理"中添加AI平台配置，填写API Key或相关参数。

## 4. 配置验证与管理
- 每次添加/编辑配置后，建议点击"验证"按钮，系统会自动检测API Key有效性
- 支持配置的导入导出，便于团队共享和备份
- 支持多MCP并行配置，适配不同项目需求

## 5. 常见配置问题与排查
- **API Key无效/过期**：请重新生成并填写最新Key
- **Figma组件库ID错误**：请确认ID为真实组件库ID
- **网络连接失败**：请检查本地网络或Figma服务状态
- **配置保存失败**：请检查数据库连接或联系管理员

## 6. 配置导入导出说明
- 在"MCP配置管理"页面，点击"导出配置"可下载当前所有配置为JSON文件
- 点击"导入配置"可批量导入JSON格式的MCP配置，适合团队协作与环境迁移

如遇更多配置相关问题，请参考[常见问题 faq.md](./faq.md)或联系技术支持。 