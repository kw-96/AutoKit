/**
 * FigmaMCP 类型定义
 */

// Figma MCP配置类型
export interface FigmaMCPConfig {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  fileId?: string;  // Figma文件ID
  teamId?: string;  // Figma团队ID
  enabled: boolean;
  settings?: FigmaMCPSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Figma MCP设置类型
export interface FigmaMCPSettings {
  socketUrl?: string;  // WebSocket服务器URL
  channelId?: string;  // 通信通道ID
  pluginId?: string;   // Figma插件ID
  defaultExportFormat?: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  defaultExportScale?: number;
  autoConnect?: boolean;
}

// Figma MCP响应类型
export interface FigmaMCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Figma MCP请求参数类型
export interface FigmaMCPRequestParams {
  action: string;
  payload?: any;
  options?: Record<string, any>;
}

// 设计规范类型
export interface FigmaDesignSpec {
  id: string;
  name: string;
  description?: string;
  version: string;
  fileId: string;
  colors: FigmaColorToken[];
  typography: FigmaTypographyToken[];
  spacing: FigmaSpacingToken[];
  effects: FigmaEffectToken[];
  components: FigmaComponentToken[];
  createdAt: Date;
  updatedAt: Date;
}

// 颜色令牌类型
export interface FigmaColorToken {
  id: string;
  name: string;
  value: string; // HEX或RGBA值
  description?: string;
  category?: string;
  usageCount?: number;
  nodeIds?: string[];
}

// 排版令牌类型
export interface FigmaTypographyToken {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  lineHeight?: number | string;
  letterSpacing?: number;
  textCase?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  category?: string;
  usageCount?: number;
  nodeIds?: string[];
}

// 间距令牌类型
export interface FigmaSpacingToken {
  id: string;
  name: string;
  value: number;
  description?: string;
  category?: string;
  usageCount?: number;
  nodeIds?: string[];
}

// 效果令牌类型
export interface FigmaEffectToken {
  id: string;
  name: string;
  type: 'shadow' | 'blur' | 'inner-shadow';
  value: any; // 效果配置
  description?: string;
  category?: string;
  usageCount?: number;
  nodeIds?: string[];
}

// 组件令牌类型
export interface FigmaComponentToken {
  id: string;
  name: string;
  description?: string;
  nodeId: string;
  key: string;
  variants?: Record<string, string>;
  usageCount?: number;
  instances?: string[];
}

// Figma组件类型
export interface FigmaComponent {
  id: string;
  name: string;
  description?: string;
  nodeId: string;
  key: string;
  fileId: string;
  elements: FigmaElement[];
  variants?: Record<string, string>;
  properties?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Figma元素类型
export interface FigmaElement {
  id: string;
  name: string;
  type: 'FRAME' | 'GROUP' | 'RECTANGLE' | 'TEXT' | 'COMPONENT' | 'INSTANCE' | 'VECTOR' | 'ELLIPSE' | 'POLYGON' | 'STAR' | 'LINE' | 'BOOLEAN_OPERATION';
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  children?: FigmaElement[];
  properties?: Record<string, any>;
}

// Figma设计稿类型
export interface FigmaDesign {
  id: string;
  name: string;
  description?: string;
  fileId: string;
  nodeId: string;
  elements: FigmaElement[];
  assets?: FigmaAsset[];
  createdAt: Date;
  updatedAt: Date;
}

// Figma资源类型
export interface FigmaAsset {
  id: string;
  name: string;
  type: 'IMAGE' | 'ICON' | 'COMPONENT';
  url?: string;
  nodeId?: string;
  fileId?: string;
}

// 通道状态类型
export interface ChannelStatus {
  id: string;
  connected: boolean;
  clientCount: number;
  lastActivity: Date;
} 