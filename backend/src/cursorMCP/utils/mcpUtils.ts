/**
 * CursorMCP 工具函数
 */

import { MCPConfig } from '../types';

/**
 * 验证MCP配置是否有效
 */
export const validateMCPConfig = (config: Partial<MCPConfig>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('名称不能为空');
  }

  if (!config.version) {
    errors.push('版本不能为空');
  }

  if (!config.apiEndpoint) {
    errors.push('API端点不能为空');
  } else if (!isValidUrl(config.apiEndpoint)) {
    errors.push('API端点必须是有效的URL');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 检查字符串是否为有效URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 生成唯一ID
 */
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * 格式化MCP配置以供显示
 */
export const formatMCPConfigForDisplay = (config: MCPConfig): Omit<MCPConfig, 'apiKey'> & { apiKey?: string } => {
  // 隐藏API密钥
  const { apiKey, ...rest } = config;
  return {
    ...rest,
    apiKey: apiKey ? '******' : undefined
  };
}; 