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
export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// MCP请求参数类型
export interface MCPRequestParams {
  action: string;
  payload?: any;
  options?: Record<string, any>;
}

// MCP服务配置
export interface MCPServiceConfig {
  timeout?: number;
  retries?: number;
  debug?: boolean;
} 