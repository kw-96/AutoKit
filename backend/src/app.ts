/**
 * 应用程序入口文件
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { createFigmaMCPRouter } from './figmaMCP';

// 创建Express应用
const app = express();

// 配置中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// 设置路由
app.use('/api/figma-mcp', createFigmaMCPRouter());

// 处理前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

export default app; 