/**
 * FigmaMCP 服务
 * 负责与Figma API和Cursor Talk To Figma MCP通信
 */

import axios from 'axios';
import WebSocket from 'ws';
import { 
  FigmaMCPConfig, 
  FigmaMCPRequestParams, 
  FigmaMCPResponse, 
  FigmaDesignSpec,
  FigmaComponent,
  FigmaDesign,
  ChannelStatus
} from '../types';
import {
  FigmaColorToken,
  FigmaTypographyToken,
  FigmaSpacingToken,
  FigmaEffectToken,
  FigmaComponentToken
} from '../types/tokens';

// Figma API基础URL
const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';

class FigmaMCPService {
  private config: FigmaMCPConfig;
  private ws: WebSocket | null = null;
  private channelId: string | null = null;
  private connected: boolean = false;
  private messageQueue: { 
    action: string; 
    payload: any; 
    resolve: (value: any) => any; 
    reject: (reason: any) => any 
  }[] = [];
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: FigmaMCPConfig) {
    this.config = config;
    
    // 如果配置中有通道ID和自动连接设置，则自动连接WebSocket
    if (config.settings?.channelId && config.settings?.autoConnect) {
      this.channelId = config.settings.channelId;
      this.connectWebSocket();
    }
  }

  /**
   * 连接WebSocket服务器
   */
  private connectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
    }

    const wsPort = process.env.FIGMA_SOCKET_PORT || 3055;
    const socketUrl = this.config.settings?.socketUrl || `ws://localhost:${wsPort}`;
    
    try {
      this.ws = new WebSocket(socketUrl);
      
      this.ws.on('open', () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log(`[FigmaMCP] WebSocket连接成功: ${socketUrl}`);
        
        // 如果有通道ID，自动加入通道
        if (this.channelId) {
          this.joinChannel(this.channelId);
        }
        
        // 处理消息队列
        this.processMessageQueue();
      });
      
      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // 检查是否有对应的消息处理器
          if (message.id && this.messageHandlers.has(message.id)) {
            const handler = this.messageHandlers.get(message.id);
            if (handler) {
              handler(message);
              this.messageHandlers.delete(message.id);
            }
          }
          
          // 处理通道消息
          if (message.type === 'channel_joined') {
            console.log(`[FigmaMCP] 已加入通道: ${message.channel}`);
            this.channelId = message.channel;
          }
        } catch (error) {
          console.error('[FigmaMCP] WebSocket消息解析错误:', error);
        }
      });
      
      this.ws.on('close', () => {
        this.connected = false;
        console.log('[FigmaMCP] WebSocket连接关闭');
        
        // 尝试重新连接
        this.attemptReconnect();
      });
      
      this.ws.on('error', (error) => {
        console.error('[FigmaMCP] WebSocket错误:', error);
        this.connected = false;
      });
    } catch (error) {
      console.error('[FigmaMCP] WebSocket连接失败:', error);
      this.connected = false;
      
      // 尝试重新连接
      this.attemptReconnect();
    }
  }

  /**
   * 尝试重新连接WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`[FigmaMCP] 将在 ${delay}ms 后尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    } else {
      console.error(`[FigmaMCP] 达到最大重连次数 (${this.maxReconnectAttempts})，停止重连`);
    }
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    if (!this.connected || !this.ws || this.messageQueue.length === 0) {
      return;
    }
    
    const pendingMessages = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const { action, payload, resolve, reject } of pendingMessages) {
      this.sendWebSocketMessage(action, payload)
        .then(resolve)
        .catch(reject);
    }
  }

  /**
   * 发送WebSocket消息
   */
  private sendWebSocketMessage(action: string, payload: any = {}): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (!this.connected || !this.ws) {
        // 如果未连接，将消息添加到队列
        this.messageQueue.push({ action, payload, resolve, reject });
        
        // 尝试连接
        if (!this.ws) {
          this.connectWebSocket();
        }
        return;
      }
      
      try {
        const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        
        // 注册消息处理器
        this.messageHandlers.set(messageId, (data) => {
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.result || data);
          }
        });
        
        // 发送消息
        const message = {
          id: messageId,
          action,
          payload,
          channel: this.channelId
        };
        
        this.ws.send(JSON.stringify(message));
        
        // 设置超时
        setTimeout(() => {
          if (this.messageHandlers.has(messageId)) {
            this.messageHandlers.delete(messageId);
            reject(new Error(`WebSocket请求超时: ${action}`));
          }
        }, 30000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 加入通道
   */
  async joinChannel(channelId: string): Promise<FigmaMCPResponse<{ channel: string }>> {
    try {
      if (!this.connected) {
        await new Promise<void>((resolve) => {
          const checkConnection = () => {
            if (this.connected) {
              resolve();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          
          checkConnection();
          
          // 如果未连接，尝试连接
          if (!this.ws) {
            this.connectWebSocket();
          }
        });
      }
      
      const result = await this.sendWebSocketMessage('join_channel', { channel: channelId });
      this.channelId = channelId;
      
      return {
        success: true,
        data: { channel: channelId }
      };
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
  async getChannelStatus(): Promise<FigmaMCPResponse<ChannelStatus>> {
    if (!this.channelId) {
      return {
        success: false,
        error: '未加入任何通道'
      };
    }
    
    try {
      const result = await this.sendWebSocketMessage('get_channel_status', { channel: this.channelId });
      
      return {
        success: true,
        data: {
          id: this.channelId,
          connected: this.connected,
          clientCount: result.clientCount || 0,
          lastActivity: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取通道状态失败'
      };
    }
  }

  /**
   * 执行Figma操作
   */
  async executeFigmaAction(params: FigmaMCPRequestParams): Promise<FigmaMCPResponse> {
    try {
      const result = await this.sendWebSocketMessage(params.action, params.payload || {});
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行Figma操作失败'
      };
    }
  }

  /**
   * 获取文档信息
   */
  async getDocumentInfo(): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'get_document_info',
      payload: {}
    });
  }

  /**
   * 获取当前选择
   */
  async getSelection(): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'get_selection',
      payload: {}
    });
  }

  /**
   * 获取节点信息
   */
  async getNodeInfo(nodeId: string): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'get_node_info',
      payload: { nodeId }
    });
  }

  /**
   * 创建矩形
   */
  async createRectangle(x: number, y: number, width: number, height: number, name?: string): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'create_rectangle',
      payload: { x, y, width, height, name }
    });
  }

  /**
   * 创建框架
   */
  async createFrame(x: number, y: number, width: number, height: number, options: any = {}): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'create_frame',
      payload: { x, y, width, height, ...options }
    });
  }

  /**
   * 创建文本
   */
  async createText(x: number, y: number, text: string, options: any = {}): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'create_text',
      payload: { x, y, text, ...options }
    });
  }

  /**
   * 设置填充颜色
   */
  async setFillColor(nodeId: string, r: number, g: number, b: number, a: number = 1): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'set_fill_color',
      payload: { nodeId, r, g, b, a }
    });
  }

  /**
   * 设置描边颜色
   */
  async setStrokeColor(nodeId: string, r: number, g: number, b: number, a: number = 1, weight?: number): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'set_stroke_color',
      payload: { nodeId, r, g, b, a, weight }
    });
  }

  /**
   * 移动节点
   */
  async moveNode(nodeId: string, x: number, y: number): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'move_node',
      payload: { nodeId, x, y }
    });
  }

  /**
   * 调整节点大小
   */
  async resizeNode(nodeId: string, width: number, height: number): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'resize_node',
      payload: { nodeId, width, height }
    });
  }

  /**
   * 删除节点
   */
  async deleteNode(nodeId: string): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'delete_node',
      payload: { nodeId }
    });
  }

  /**
   * 获取样式
   */
  async getStyles(): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'get_styles',
      payload: {}
    });
  }

  /**
   * 获取本地组件
   */
  async getLocalComponents(): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'get_local_components',
      payload: {}
    });
  }

  /**
   * 导出节点为图像
   */
  async exportNodeAsImage(nodeId: string, format: 'PNG' | 'JPG' | 'SVG' | 'PDF' = 'PNG', scale: number = 1): Promise<FigmaMCPResponse> {
    return this.executeFigmaAction({
      action: 'export_node_as_image',
      payload: { nodeId, format, scale }
    });
  }

  /**
   * 获取Figma文件信息
   * 使用Figma API直接获取文件信息
   */
  async getFigmaFile(fileId?: string): Promise<FigmaMCPResponse> {
    const targetFileId = fileId || this.config.fileId;
    
    if (!targetFileId) {
      return {
        success: false,
        error: '未提供Figma文件ID'
      };
    }
    
    try {
      const response = await axios.get(`${FIGMA_API_BASE_URL}/files/${targetFileId}`, {
        headers: {
          'X-Figma-Token': this.config.apiKey
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取Figma文件失败'
      };
    }
  }

  /**
   * 生成设计规范
   */
  async generateDesignSpec(fileId?: string): Promise<FigmaMCPResponse<FigmaDesignSpec>> {
    const targetFileId = fileId || this.config.fileId;
    
    if (!targetFileId) {
      return {
        success: false,
        error: '未提供Figma文件ID'
      };
    }
    
    try {
      // 获取文件信息
      const fileResponse = await this.getFigmaFile(targetFileId);
      
      if (!fileResponse.success) {
        return fileResponse as FigmaMCPResponse<FigmaDesignSpec>;
      }
      
      // 获取样式信息
      const stylesResponse = await this.getStyles();
      
      if (!stylesResponse.success) {
        return stylesResponse as FigmaMCPResponse<FigmaDesignSpec>;
      }
      
      // 获取组件信息
      const componentsResponse = await this.getLocalComponents();
      
      if (!componentsResponse.success) {
        return componentsResponse as FigmaMCPResponse<FigmaDesignSpec>;
      }
      
      // 处理颜色令牌
      const colors = this.extractColorTokens(stylesResponse.data);
      
      // 处理排版令牌
      const typography = this.extractTypographyTokens(stylesResponse.data);
      
      // 处理间距令牌
      const spacing = this.extractSpacingTokens(fileResponse.data);
      
      // 处理效果令牌
      const effects = this.extractEffectTokens(stylesResponse.data);
      
      // 处理组件令牌
      const components = this.extractComponentTokens(componentsResponse.data);
      
      // 构建设计规范
      const designSpec: FigmaDesignSpec = {
        id: Date.now().toString(),
        name: fileResponse.data.name || '设计规范',
        description: '从Figma自动提取的设计规范',
        version: '1.0.0',
        fileId: targetFileId,
        colors,
        typography,
        spacing,
        effects,
        components,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        data: designSpec
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成设计规范失败'
      };
    }
  }

  /**
   * 提取颜色令牌
   */
  private extractColorTokens(stylesData: any): FigmaColorToken[] {
    const colorTokens: FigmaColorToken[] = [];
    
    if (!stylesData || !stylesData.styles) {
      return colorTokens;
    }
    
    // 处理颜色样式
    const colorStyles = stylesData.styles.filter((style: any) => style.styleType === 'FILL');
    
    for (const style of colorStyles) {
      if (style.style && style.style.fills && style.style.fills.length > 0) {
        const fill = style.style.fills[0];
        
        if (fill.type === 'SOLID') {
          const { r, g, b, a } = fill.color;
          const hexColor = this.rgbaToHex(r, g, b, a);
          
          colorTokens.push({
            id: style.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: style.name || `Color-${colorTokens.length + 1}`,
            value: hexColor,
            description: style.description || '',
            category: style.name.split('/')[0] || 'colors',
            nodeIds: style.nodeIds || []
          });
        }
      }
    }
    
    return colorTokens;
  }

  /**
   * 提取排版令牌
   */
  private extractTypographyTokens(stylesData: any): FigmaTypographyToken[] {
    const typographyTokens: FigmaTypographyToken[] = [];
    
    if (!stylesData || !stylesData.styles) {
      return typographyTokens;
    }
    
    // 处理文本样式
    const textStyles = stylesData.styles.filter((style: any) => style.styleType === 'TEXT');
    
    for (const style of textStyles) {
      if (style.style) {
        typographyTokens.push({
          id: style.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: style.name || `Typography-${typographyTokens.length + 1}`,
          fontFamily: style.style.fontFamily || 'Inter',
          fontSize: style.style.fontSize || 16,
          fontWeight: style.style.fontWeight || 400,
          lineHeight: style.style.lineHeight?.value || 'normal',
          letterSpacing: style.style.letterSpacing?.value || 0,
          textCase: style.style.textCase || 'none',
          textDecoration: style.style.textDecoration || 'none',
          category: style.name.split('/')[0] || 'typography',
          nodeIds: style.nodeIds || []
        });
      }
    }
    
    return typographyTokens;
  }

  /**
   * 提取间距令牌
   */
  private extractSpacingTokens(fileData: any): FigmaSpacingToken[] {
    const spacingTokens: FigmaSpacingToken[] = [];
    const spacingValues = new Set<number>();
    
    // 分析文件中的间距
    const analyzeNode = (node: any) => {
      if (!node) return;
      
      // 检查自动布局的间距
      if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
        if (node.itemSpacing > 0) {
          spacingValues.add(node.itemSpacing);
        }
      }
      
      // 检查内边距
      if (node.paddingLeft > 0) spacingValues.add(node.paddingLeft);
      if (node.paddingRight > 0) spacingValues.add(node.paddingRight);
      if (node.paddingTop > 0) spacingValues.add(node.paddingTop);
      if (node.paddingBottom > 0) spacingValues.add(node.paddingBottom);
      
      // 递归处理子节点
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          analyzeNode(child);
        }
      }
    };
    
    // 从文件根节点开始分析
    if (fileData.document) {
      analyzeNode(fileData.document);
    }
    
    // 将收集到的间距值转换为令牌
    let index = 0;
    for (const value of [...spacingValues].sort((a, b) => a - b)) {
      const size = index === 0 ? 'xs' : 
                  index === 1 ? 'sm' : 
                  index === 2 ? 'md' : 
                  index === 3 ? 'lg' : 
                  index === 4 ? 'xl' : `${index + 1}x`;
      
      spacingTokens.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: `spacing-${size}`,
        value,
        description: `间距 ${value}px`,
        category: 'spacing'
      });
      
      index++;
    }
    
    return spacingTokens;
  }

  /**
   * 提取效果令牌
   */
  private extractEffectTokens(stylesData: any): FigmaEffectToken[] {
    const effectTokens: FigmaEffectToken[] = [];
    
    if (!stylesData || !stylesData.styles) {
      return effectTokens;
    }
    
    // 处理效果样式
    const effectStyles = stylesData.styles.filter((style: any) => style.styleType === 'EFFECT');
    
    for (const style of effectStyles) {
      if (style.style && style.style.effects && style.style.effects.length > 0) {
        for (const effect of style.style.effects) {
          let type: 'shadow' | 'blur' | 'inner-shadow' = 'shadow';
          
          if (effect.type === 'DROP_SHADOW') {
            type = 'shadow';
          } else if (effect.type === 'INNER_SHADOW') {
            type = 'inner-shadow';
          } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
            type = 'blur';
          } else {
            continue;
          }
          
          effectTokens.push({
            id: style.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: style.name || `Effect-${effectTokens.length + 1}`,
            type,
            value: effect,
            description: style.description || '',
            category: style.name.split('/')[0] || 'effects',
            nodeIds: style.nodeIds || []
          });
        }
      }
    }
    
    return effectTokens;
  }

  /**
   * 提取组件令牌
   */
  private extractComponentTokens(componentsData: any): FigmaComponentToken[] {
    const componentTokens: FigmaComponentToken[] = [];
    
    if (!componentsData || !componentsData.components) {
      return componentTokens;
    }
    
    for (const component of componentsData.components) {
      componentTokens.push({
        id: component.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: component.name || `Component-${componentTokens.length + 1}`,
        description: component.description || '',
        nodeId: component.nodeId || '',
        key: component.key || '',
        variants: this.parseComponentVariants(component.name),
        usageCount: component.usageCount || 0,
        instances: component.instances || []
      });
    }
    
    return componentTokens;
  }

  /**
   * 解析组件变体
   */
  private parseComponentVariants(name: string): Record<string, string> {
    const variants: Record<string, string> = {};
    
    if (!name || !name.includes('=')) {
      return variants;
    }
    
    const parts = name.split(',');
    
    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      
      if (key && value) {
        variants[key.trim()] = value.trim();
      }
    }
    
    return variants;
  }

  /**
   * 将RGBA转换为HEX颜色值
   */
  private rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
    // 将0-1范围的颜色值转换为0-255
    const rInt = Math.round(r * 255);
    const gInt = Math.round(g * 255);
    const bInt = Math.round(b * 255);
    const aInt = Math.round(a * 255);
    
    // 转换为HEX
    const rHex = rInt.toString(16).padStart(2, '0');
    const gHex = gInt.toString(16).padStart(2, '0');
    const bHex = bInt.toString(16).padStart(2, '0');
    
    // 如果alpha为1，返回#RRGGBB，否则返回#RRGGBBAA
    return a === 1 ? 
      `#${rHex}${gHex}${bHex}` : 
      `#${rHex}${gHex}${bHex}${aInt.toString(16).padStart(2, '0')}`;
  }

  /**
   * 获取MCP配置
   */
  getConfig(): FigmaMCPConfig {
    // 返回副本以防止外部修改
    return { ...this.config };
  }

  /**
   * 更新MCP配置
   */
  updateConfig(newConfig: Partial<FigmaMCPConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      updatedAt: new Date()
    };
    
    // 如果更新了通道ID或自动连接设置，重新连接WebSocket
    if (newConfig.settings?.channelId || newConfig.settings?.autoConnect !== undefined) {
      if (newConfig.settings?.channelId) {
        this.channelId = newConfig.settings.channelId;
      }
      
      if (this.config.settings?.autoConnect) {
        this.connectWebSocket();
      } else if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.connected = false;
      }
    }
  }
}

export default FigmaMCPService; 