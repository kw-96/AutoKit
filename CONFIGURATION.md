# 配置说明

## 环境配置
1. 复制 ackend/config/mcp-config.example.json 为 mcp-config.json
2. 在 mcp-config.json 中填入您的实际配置信息
3. 确保不要将包含敏感信息的配置文件提交到版本控制

## 注意事项
- mcp-config.json 已被添加到 .gitignore
- 请妥善保管您的 API 密钥和访问令牌

## 使用方法
`ash
# 复制模板文件
copy backend/config/mcp-config.example.json backend/config/mcp-config.json

# 编辑配置文件，填入真实的 token
notepad backend/config/mcp-config.json
