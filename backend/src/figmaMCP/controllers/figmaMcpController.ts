/**
 * FigmaMCP 控制器
 * 处理与Figma MCP相关的HTTP请求
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import FigmaMCPService from '../services/figmaMcpService';
import { FigmaMCPConfig, FigmaMCPRequestParams } from '../types';
import { createFigmaMCPService } from '../index';
import fs from 'fs';
import path from 'path';

// 配置文件路径
const CONFIG_FILE_PATH = path.resolve(__dirname, '../../../config/mcp-config.json');

// 从配置文件加载FigmaMCP配置
const loadFigmaMcpConfigs = (): FigmaMCPConfig[] => {
  try {
    console.log(`正在从文件加载配置: ${CONFIG_FILE_PATH}`);
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const configs = JSON.parse(fileContent) as any[];
      console.log(`成功加载配置: ${configs.length}个配置项`);
      return configs.filter((config: any) => config.type === 'FigmaMCP').map((config: any) => ({
        ...config,
        createdAt: new Date(config.createdAt || Date.now()),
        updatedAt: new Date(config.updatedAt || Date.now())
      }));
    }
  } catch (error) {
    console.error('加载配置文件失败:', error);
  }
  return [];
};

// 保存FigmaMCP配置到文件
const saveFigmaMcpConfigs = (configs: FigmaMCPConfig[]): void => {
  try {
    // 先从文件读取所有配置
    let allConfigs: any[] = [];
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      allConfigs = JSON.parse(fileContent);
    }
    
    // 过滤掉所有FigmaMCP类型的配置
    allConfigs = allConfigs.filter((config: any) => config.type !== 'FigmaMCP');
    
    // 将新的FigmaMCP配置与其他配置合并
    allConfigs = [...allConfigs, ...configs];
    
    // 保存到文件
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(allConfigs, null, 2), 'utf-8');
    console.log('配置已保存到文件');
  } catch (error) {
    console.error('保存配置文件失败:', error);
  }
};

// 初始化从文件加载配置
let figmaMcpConfigs: FigmaMCPConfig[] = loadFigmaMcpConfigs();

// 存储FigmaMCP服务实例
const figmaMcpServices: Map<string, FigmaMCPService> = new Map();

/**
 * 获取所有FigmaMCP配置
 */
export const getFigmaMCPConfigs = (req: Request, res: Response): void => {
  // 重新从文件加载配置
  figmaMcpConfigs = loadFigmaMcpConfigs();
  
  res.json({
    success: true,
    data: figmaMcpConfigs
  });
};

/**
 * 根据ID获取FigmaMCP配置
 */
export const getFigmaMCPConfigById = (req: Request, res: Response): void => {
  // 重新从文件加载配置
  figmaMcpConfigs = loadFigmaMcpConfigs();
  
  const { id } = req.params;
  const config = figmaMcpConfigs.find(config => config.id === id);
  
  if (!config) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${id}的FigmaMCP配置`
    });
    return;
  }
  
  res.json({
    success: true,
    data: config
  });
};

/**
 * 创建FigmaMCP配置
 */
export const createFigmaMCPConfig = (req: Request, res: Response): void => {
  const { name, description, apiKey, fileId, teamId, settings } = req.body;
  
  if (!name || !apiKey) {
    res.status(400).json({
      success: false,
      error: '名称和API密钥是必需的'
    });
    return;
  }
  
  const newConfig: FigmaMCPConfig = {
    id: uuidv4(),
    name,
    description,
    apiKey,
    fileId,
    teamId,
    type: 'FigmaMCP',
    enabled: true,
    settings,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  figmaMcpConfigs.push(newConfig);
  saveFigmaMcpConfigs(figmaMcpConfigs);
  
  // 创建FigmaMCP服务实例
  const service = createFigmaMCPService(newConfig);
  figmaMcpServices.set(newConfig.id, service);
  
  res.status(201).json({
    success: true,
    data: newConfig
  });
};

/**
 * 更新FigmaMCP配置
 */
export const updateFigmaMCPConfig = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name, description, apiKey, fileId, teamId, enabled, settings } = req.body;
  
  const configIndex = figmaMcpConfigs.findIndex(config => config.id === id);
  
  if (configIndex === -1) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${id}的FigmaMCP配置`
    });
    return;
  }
  
  const updatedConfig: FigmaMCPConfig = {
    ...figmaMcpConfigs[configIndex],
    name: name !== undefined ? name : figmaMcpConfigs[configIndex].name,
    description: description !== undefined ? description : figmaMcpConfigs[configIndex].description,
    apiKey: apiKey !== undefined ? apiKey : figmaMcpConfigs[configIndex].apiKey,
    fileId: fileId !== undefined ? fileId : figmaMcpConfigs[configIndex].fileId,
    teamId: teamId !== undefined ? teamId : figmaMcpConfigs[configIndex].teamId,
    enabled: enabled !== undefined ? enabled : figmaMcpConfigs[configIndex].enabled,
    settings: settings !== undefined ? settings : figmaMcpConfigs[configIndex].settings,
    updatedAt: new Date()
  };
  
  figmaMcpConfigs[configIndex] = updatedConfig;
  saveFigmaMcpConfigs(figmaMcpConfigs);
  
  // 更新FigmaMCP服务实例配置
  const service = figmaMcpServices.get(id);
  if (service) {
    service.updateConfig(updatedConfig);
  } else {
    // 如果服务实例不存在，创建新的实例
    const newService = createFigmaMCPService(updatedConfig);
    figmaMcpServices.set(id, newService);
  }
  
  res.json({
    success: true,
    data: updatedConfig
  });
};

/**
 * 删除FigmaMCP配置
 */
export const deleteFigmaMCPConfig = (req: Request, res: Response): void => {
  const { id } = req.params;
  
  const configIndex = figmaMcpConfigs.findIndex(config => config.id === id);
  
  if (configIndex === -1) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${id}的FigmaMCP配置`
    });
    return;
  }
  
  // 删除FigmaMCP服务实例
  figmaMcpServices.delete(id);
  
  // 删除配置
  figmaMcpConfigs.splice(configIndex, 1);
  saveFigmaMcpConfigs(figmaMcpConfigs);
  
  res.json({
    success: true,
    message: `ID为${id}的FigmaMCP配置已删除`
  });
};

/**
 * 获取FigmaMCP服务实例
 */
const getFigmaMCPService = (configId: string): FigmaMCPService | null => {
  const service = figmaMcpServices.get(configId);
  
  if (!service) {
    const config = figmaMcpConfigs.find(config => config.id === configId);
    
    if (!config) {
      return null;
    }
    
    const newService = createFigmaMCPService(config);
    figmaMcpServices.set(configId, newService);
    return newService;
  }
  
  return service;
};

/**
 * 执行Figma操作
 */
export const executeFigmaAction = async (req: Request, res: Response): Promise<void> => {
  const { configId, action, payload, options } = req.body;
  
  if (!configId || !action) {
    res.status(400).json({
      success: false,
      error: '配置ID和操作是必需的'
    });
    return;
  }
  
  const service = getFigmaMCPService(configId);
  
  if (!service) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${configId}的FigmaMCP服务实例`
    });
    return;
  }
  
  try {
    const params: FigmaMCPRequestParams = {
      action,
      payload,
      options
    };
    
    const result = await service.executeFigmaAction(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '执行Figma操作失败'
    });
  }
};

/**
 * 加入通道
 */
export const joinChannel = async (req: Request, res: Response): Promise<void> => {
  const { configId, channelId } = req.body;
  
  if (!configId || !channelId) {
    res.status(400).json({
      success: false,
      error: '配置ID和通道ID是必需的'
    });
    return;
  }
  
  const service = getFigmaMCPService(configId);
  
  if (!service) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${configId}的FigmaMCP服务实例`
    });
    return;
  }
  
  try {
    const result = await service.joinChannel(channelId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '加入通道失败'
    });
  }
};

/**
 * 获取通道状态
 */
export const getChannelStatus = async (req: Request, res: Response): Promise<void> => {
  const { configId } = req.query;
  
  if (!configId) {
    res.status(400).json({
      success: false,
      error: '配置ID是必需的'
    });
    return;
  }
  
  const service = getFigmaMCPService(configId as string);
  
  if (!service) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${configId}的FigmaMCP服务实例`
    });
    return;
  }
  
  try {
    const result = await service.getChannelStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取通道状态失败'
    });
  }
};

/**
 * 生成设计规范
 */
export const generateDesignSpec = async (req: Request, res: Response): Promise<void> => {
  const { configId, fileId } = req.body;
  
  if (!configId) {
    res.status(400).json({
      success: false,
      error: '配置ID是必需的'
    });
    return;
  }
  
  const service = getFigmaMCPService(configId);
  
  if (!service) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${configId}的FigmaMCP服务实例`
    });
    return;
  }
  
  try {
    const result = await service.generateDesignSpec(fileId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '生成设计规范失败'
    });
  }
};

/**
 * 获取设计规范
 */
export const getDesignSpec = (req: Request, res: Response): void => {
  const { id } = req.params;
  
  // 这里应该从数据库或缓存中获取设计规范
  // 暂时返回未实现
  res.status(501).json({
    success: false,
    error: '获取设计规范功能尚未实现'
  });
};

/**
 * 生成组件
 */
export const generateComponent = async (req: Request, res: Response): Promise<void> => {
  const { configId, componentSpec } = req.body;
  
  if (!configId || !componentSpec) {
    res.status(400).json({
      success: false,
      error: '配置ID和组件规范是必需的'
    });
    return;
  }
  
  const service = getFigmaMCPService(configId);
  
  if (!service) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${configId}的FigmaMCP服务实例`
    });
    return;
  }
  
  // 这里应该实现组件生成逻辑
  // 暂时返回未实现
  res.status(501).json({
    success: false,
    error: '生成组件功能尚未实现'
  });
};

/**
 * 获取组件
 */
export const getComponent = (req: Request, res: Response): void => {
  const { id } = req.params;
  
  // 这里应该从数据库或缓存中获取组件
  // 暂时返回未实现
  res.status(501).json({
    success: false,
    error: '获取组件功能尚未实现'
  });
};

/**
 * 生成设计稿
 */
export const generateDesign = async (req: Request, res: Response): Promise<void> => {
  const { configId, designSpec } = req.body;
  
  if (!configId || !designSpec) {
    res.status(400).json({
      success: false,
      error: '配置ID和设计规范是必需的'
    });
    return;
  }
  
  const service = getFigmaMCPService(configId);
  
  if (!service) {
    res.status(404).json({
      success: false,
      error: `未找到ID为${configId}的FigmaMCP服务实例`
    });
    return;
  }
  
  // 这里应该实现设计稿生成逻辑
  // 暂时返回未实现
  res.status(501).json({
    success: false,
    error: '生成设计稿功能尚未实现'
  });
};

/**
 * 获取设计稿
 */
export const getDesign = (req: Request, res: Response): void => {
  const { id } = req.params;
  
  // 这里应该从数据库或缓存中获取设计稿
  // 暂时返回未实现
  res.status(501).json({
    success: false,
    error: '获取设计稿功能尚未实现'
  });
}; 