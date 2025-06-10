/**
 * CursorMCP 前端服务
 * 负责与后端CursorMCP API通信
 */

import axios from 'axios';
import { MCPConfig, MCPRequestParams, MCPResponse } from './types';

const API_BASE_URL = 'http://localhost:3001/api/cursor-mcp';

/**
 * CursorMCP API服务类
 */
export class CursorMCPService {
  /**
   * 获取所有MCP配置
   */
  static async getAllConfigs(): Promise<MCPResponse<MCPConfig[]>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/configs`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取MCP配置失败'
      };
    }
  }

  /**
   * 获取指定MCP配置
   */
  static async getConfigById(id: string): Promise<MCPResponse<MCPConfig>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/configs/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取MCP配置失败'
      };
    }
  }

  /**
   * 创建MCP配置
   */
  static async createConfig(config: Omit<MCPConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MCPResponse<MCPConfig>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/configs`, config);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建MCP配置失败'
      };
    }
  }

  /**
   * 更新MCP配置
   */
  static async updateConfig(id: string, config: Partial<MCPConfig>): Promise<MCPResponse<MCPConfig>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/configs/${id}`, config);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新MCP配置失败'
      };
    }
  }

  /**
   * 删除MCP配置
   */
  static async deleteConfig(id: string): Promise<MCPResponse<void>> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/configs/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除MCP配置失败'
      };
    }
  }

  /**
   * 执行MCP操作
   */
  static async executeAction(id: string, params: MCPRequestParams): Promise<MCPResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/configs/${id}/execute`, params);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行MCP操作失败'
      };
    }
  }
} 