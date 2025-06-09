@echo off
REM AutoKit 一键启动前后端开发环境（Windows专用）

echo 正在启动后端服务...
start cmd /k "cd /d %~dp0backend && npm run dev"

echo 正在启动前端服务...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo =============================
echo 已在两个新窗口分别启动前后端开发服务。
echo 后端端口: 3001
echo 前端端口: 5173
echo 如需停止服务，请分别关闭对应命令行窗口。
echo =============================
pause 