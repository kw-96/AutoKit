/**
 * CursorMCP 服务
 * 负责与Cursor MCP API通信
 */

import axios from 'axios';
import { MCPConfig, MCPRequestParams, MCPResponse, MCPServiceConfig } from '../types';

class CursorMCPService {
  private config: MCPConfig;
  private serviceConfig: MCPServiceConfig;

  constructor(config: MCPConfig, serviceConfig: MCPServiceConfig = {}) {
    this.config = config;
    this.serviceConfig = {
      timeout: 30000,
      retries: 3,
      debug: false,
      ...serviceConfig
    };
  }

  /**
   * 发送请求到Cursor MCP API
   */
  async sendRequest(params: MCPRequestParams): Promise<MCPResponse> {
    try {
      if (this.serviceConfig.debug) {
        console.log(`[CursorMCP] 发送请求: ${JSON.stringify(params)}`);
      }

      const response = await axios({
        method: 'post',
        url: this.config.apiEndpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        data: params,
        timeout: this.serviceConfig.timeout
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      if (this.serviceConfig.debug) {
        console.error(`[CursorMCP] 请求错误:`, error);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取MCP配置
   */
  getConfig(): MCPConfig {
    // 返回副本以防止外部修改
    return { ...this.config };
  }

  /**
   * 更新MCP配置
   */
  updateConfig(newConfig: Partial<MCPConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      updatedAt: new Date()
    };
  }
}

export default CursorMCPService; 