/**
 * CursorMCP 控制器
 * 处理MCP相关的HTTP请求
 */

import { Request, Response } from 'express';
import CursorMCPService from '../services/mcpService';
import { MCPConfig, MCPRequestParams } from '../types';

// 模拟数据库中的配置
let mcpConfigs: MCPConfig[] = [];

export const getMCPConfigs = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: mcpConfigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取MCP配置失败'
    });
  }
};

export const getMCPConfigById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = mcpConfigs.find(config => config.id === id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: '未找到指定的MCP配置'
      });
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取MCP配置失败'
    });
  }
};

export const createMCPConfig = async (req: Request, res: Response) => {
  try {
    const { name, description, version, apiEndpoint, apiKey, enabled, settings } = req.body;
    
    const newConfig: MCPConfig = {
      id: Date.now().toString(),
      name,
      description,
      version,
      apiEndpoint,
      apiKey,
      enabled: enabled || false,
      settings: settings || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mcpConfigs.push(newConfig);

    res.status(201).json({
      success: true,
      data: newConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建MCP配置失败'
    });
  }
};

export const updateMCPConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const configIndex = mcpConfigs.findIndex(config => config.id === id);
    
    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '未找到指定的MCP配置'
      });
    }

    const updatedConfig = {
      ...mcpConfigs[configIndex],
      ...req.body,
      updatedAt: new Date()
    };

    mcpConfigs[configIndex] = updatedConfig;

    res.status(200).json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新MCP配置失败'
    });
  }
};

export const deleteMCPConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const configIndex = mcpConfigs.findIndex(config => config.id === id);
    
    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '未找到指定的MCP配置'
      });
    }

    mcpConfigs.splice(configIndex, 1);

    res.status(200).json({
      success: true,
      message: '成功删除MCP配置'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除MCP配置失败'
    });
  }
};

export const executeMCPAction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, payload, options } = req.body as MCPRequestParams;
    
    const config = mcpConfigs.find(config => config.id === id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: '未找到指定的MCP配置'
      });
    }

    if (!config.enabled) {
      return res.status(400).json({
        success: false,
        error: 'MCP配置当前已禁用'
      });
    }

    const mcpService = new CursorMCPService(config);
    const response = await mcpService.sendRequest({ action, payload, options });

    res.status(response.success ? 200 : 500).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '执行MCP操作失败'
    });
  }
}; 