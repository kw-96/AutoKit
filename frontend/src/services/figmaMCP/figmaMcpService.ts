/**
 * FigmaMCP服务
 * 用于与后端FigmaMCP API交互
 */

import axios from 'axios';
import { MCPConfig, MCPResponse } from './types';

// 修改API基础URL，与后端路由保持一致
const API_BASE_URL = '/api/figma-mcp';

export class FigmaMCPService {
  /**
   * 获取所有配置
   */
  static async getConfigs(): Promise<MCPResponse<MCPConfig[]>> {
    try {
      // 调试信息
      console.log(`正在请求配置列表: ${API_BASE_URL}/configs`);
      const response = await axios.get(`${API_BASE_URL}/configs`);
      console.log('获取配置响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('获取配置失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取配置失败'
      };
    }
  }

  /**
   * 获取配置详情
   */
  static async getConfig(id: string): Promise<MCPResponse<MCPConfig>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/configs/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取配置详情失败'
      };
    }
  }

  /**
   * 创建配置
   */
  static async createConfig(config: Partial<MCPConfig>): Promise<MCPResponse<MCPConfig>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/configs`, config);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建配置失败'
      };
    }
  }

  /**
   * 更新配置
   */
  static async updateConfig(id: string, config: Partial<MCPConfig>): Promise<MCPResponse<MCPConfig>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/configs/${id}`, config);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新配置失败'
      };
    }
  }

  /**
   * 删除配置
   */
  static async deleteConfig(id: string): Promise<MCPResponse<void>> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/configs/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除配置失败'
      };
    }
  }

  /**
   * 执行Figma操作
   */
  static async executeFigmaAction(configId: string, action: string, payload?: any, options?: any): Promise<MCPResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/execute`, {
        configId,
        action,
        payload,
        options
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行Figma操作失败'
      };
    }
  }

  /**
   * 加入通道
   */
  static async joinChannel(configId: string, channelId: string): Promise<MCPResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/channels/join`, {
        configId,
        channelId
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '加入通道失败'
      };
    }
  }

  /**
   * 获取通道状态
   */
  static async getChannelStatus(configId: string): Promise<MCPResponse<any>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/channels/status?configId=${configId}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取通道状态失败'
      };
    }
  }

  /**
   * 生成设计规范
   */
  static async generateDesignSpec(configId: string, fileId?: string): Promise<MCPResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/design-spec/generate`, {
        configId,
        fileId
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成设计规范失败'
      };
    }
  }

  /**
   * 获取设计规范
   */
  static async getDesignSpec(id: string): Promise<MCPResponse<any>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/design-spec/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取设计规范失败'
      };
    }
  }

  /**
   * 生成组件
   */
  static async generateComponent(configId: string, componentSpec: any): Promise<MCPResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/components/generate`, {
        configId,
        componentSpec
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成组件失败'
      };
    }
  }

  /**
   * 生成设计稿
   */
  static async generateDesign(configId: string, designSpec: any): Promise<MCPResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/designs/generate`, {
        configId,
        designSpec
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成设计稿失败'
      };
    }
  }
} 