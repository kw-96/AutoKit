/**
 * 后端服务入口文件
 */

import express from 'express';
import cors from 'cors';
import mcpConfigRouter from './routes/mcpConfig';
import designSystemRouter from './routes/designSystem';
import componentRouter from './routes/component';
import designRouter from './routes/design';
import codeRouter from './routes/code';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { connectMongo } from './db/mongo';
import { createMCPRouter } from './cursorMCP';
import app from './app';
import { spawn } from 'child_process';
import path from 'path';

const PORT = process.env.PORT || 3001;
const FIGMA_SOCKET_PORT = process.env.FIGMA_SOCKET_PORT || 3055;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AutoKit API',
      version: '1.0.0',
      description: 'AutoKit 设计系统自动化工具后端API文档'
    },
    servers: [
      { url: 'http://localhost:' + PORT }
    ]
  },
  apis: ['./src/routes/*.ts']
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/mcp-config', mcpConfigRouter);
app.use('/api/design-system', designSystemRouter);
app.use('/api/component', componentRouter);
app.use('/api/design', designRouter);
app.use('/api/code', codeRouter);
app.use('/api/cursor-mcp', createMCPRouter());

app.get('/', (req, res) => {
  res.send('AutoKit Backend API Running');
});

(async () => {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`AutoKit backend listening on port ${PORT}`);
    console.log(`Swagger API docs available at http://localhost:${PORT}/api-docs`);
  });
})();

// 启动WebSocket服务器
try {
  console.log(`正在启动Figma WebSocket服务器 (端口: ${FIGMA_SOCKET_PORT})...`);
  const socketPath = path.join(__dirname, 'figmaMCP', 'socket.ts');
  
  // 使用bun运行socket.ts，并传递环境变量
  const socketProcess = spawn('bun', ['run', socketPath], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FIGMA_SOCKET_PORT: FIGMA_SOCKET_PORT.toString() }
  });
  
  socketProcess.on('error', (error) => {
    console.error('WebSocket服务器启动失败:', error);
  });
  
  // 当主进程退出时，确保WebSocket服务器也退出
  process.on('exit', () => {
    socketProcess.kill();
  });
  
  // 捕获中断信号
  process.on('SIGINT', () => {
    socketProcess.kill();
    process.exit();
  });
  
  console.log(`Figma WebSocket服务器启动成功 (端口: ${FIGMA_SOCKET_PORT})`);
} catch (error) {
  console.error('启动WebSocket服务器时出错:', error);
} 