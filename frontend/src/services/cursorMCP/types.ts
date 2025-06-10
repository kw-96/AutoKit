/**
 * CursorMCP 类型定义
 */

// MCP配置类型
export interface MCPConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  apiEndpoint: string;
  apiKey?: string;
  enabled: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// MCP响应类型
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// MCP请求参数类型
export interface MCPRequestParams {
  action: string;
  payload?: any;
  options?: Record<string, any>;
} 