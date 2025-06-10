/**
 * CursorMCP 模块入口
 */

import { Router } from 'express';
import * as mcpController from './controllers/mcpController';
import CursorMCPService from './services/mcpService';
import * as mcpUtils from './utils/mcpUtils';
import { MCPConfig } from './types';

// 导出类型
export * from './types';

// 导出工具函数
export { mcpUtils };

// 导出服务
export { CursorMCPService };

/**
 * 创建MCP路由
 */
export const createMCPRouter = (): Router => {
  const router = Router();

  // MCP配置管理路由
  router.get('/configs', mcpController.getMCPConfigs);
  router.get('/configs/:id', mcpController.getMCPConfigById);
  router.post('/configs', mcpController.createMCPConfig);
  router.put('/configs/:id', mcpController.updateMCPConfig);
  router.delete('/configs/:id', mcpController.deleteMCPConfig);

  // MCP操作路由
  router.post('/configs/:id/execute', mcpController.executeMCPAction);

  return router;
};

/**
 * 创建默认MCP服务实例
 */
export const createDefaultMCPService = (config: MCPConfig): CursorMCPService => {
  return new CursorMCPService(config);
}; 