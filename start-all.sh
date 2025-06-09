#!/bin/bash
# AutoKit 一键启动前后端开发环境（macOS/Linux专用）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 启动后端服务
if command -v open >/dev/null 2>&1; then
  echo "正在启动后端服务..."
  open -a Terminal "$SCRIPT_DIR/backend" --args bash -c "npm run dev; exec bash"
else
  echo "正在启动后端服务..."
  gnome-terminal -- bash -c "cd '$SCRIPT_DIR/backend'; npm run dev; exec bash" &
fi

# 启动前端服务
if command -v open >/dev/null 2>&1; then
  echo "正在启动前端服务..."
  open -a Terminal "$SCRIPT_DIR/frontend" --args bash -c "npm run dev; exec bash"
else
  echo "正在启动前端服务..."
  gnome-terminal -- bash -c "cd '$SCRIPT_DIR/frontend'; npm run dev; exec bash" &
fi

echo "============================="
echo "已在新终端窗口分别启动前后端开发服务。"
echo "后端端口: 3001"
echo "前端端口: 5173"
echo "如需停止服务，请分别关闭对应终端窗口。"
echo "=============================" 