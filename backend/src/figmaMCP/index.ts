/**
 * FigmaMCP 模块入口
 * 专注于实现Figma与Cursor的数据打通
 */

import { Router } from 'express';
import * as figmaMcpController from './controllers/figmaMcpController';
import FigmaMCPService from './services/figmaMcpService';
import * as figmaUtils from './utils/figmaUtils';
import { FigmaMCPConfig, FigmaDesignSpec, FigmaComponent } from './types';

// 导出类型
export * from './types';

// 导出工具函数
export { figmaUtils };

// 导出服务
export { FigmaMCPService };

/**
 * 创建FigmaMCP路由
 */
export const createFigmaMCPRouter = (): Router => {
  const router = Router();

  // FigmaMCP配置管理路由
  router.get('/configs', figmaMcpController.getFigmaMCPConfigs);
  router.get('/configs/:id', figmaMcpController.getFigmaMCPConfigById);
  router.post('/configs', figmaMcpController.createFigmaMCPConfig);
  router.put('/configs/:id', figmaMcpController.updateFigmaMCPConfig);
  router.delete('/configs/:id', figmaMcpController.deleteFigmaMCPConfig);

  // 设计规范相关路由
  router.post('/design-spec/generate', figmaMcpController.generateDesignSpec);
  router.get('/design-spec/:id', figmaMcpController.getDesignSpec);
  
  // 组件相关路由
  router.post('/components/generate', figmaMcpController.generateComponent);
  router.get('/components/:id', figmaMcpController.getComponent);
  
  // 设计稿相关路由
  router.post('/designs/generate', figmaMcpController.generateDesign);
  router.get('/designs/:id', figmaMcpController.getDesign);

  // Figma操作路由
  router.post('/execute', figmaMcpController.executeFigmaAction);
  
  // 通道管理路由
  router.post('/channels/join', figmaMcpController.joinChannel);
  router.get('/channels/status', figmaMcpController.getChannelStatus);

  return router;
};

/**
 * 创建FigmaMCP服务实例
 */
export const createFigmaMCPService = (config: FigmaMCPConfig): FigmaMCPService => {
  return new FigmaMCPService(config);
}; 