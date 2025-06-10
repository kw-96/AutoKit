/**
 * FigmaMCP 类型定义
 */

// MCP配置类型
export interface MCPConfig {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  fileId?: string;
  teamId?: string;
  enabled: boolean;
  settings?: MCPSettings;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// MCP设置类型
export interface MCPSettings {
  socketUrl?: string;
  channelId?: string;
  pluginId?: string;
  defaultExportFormat?: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  defaultExportScale?: number;
  autoConnect?: boolean;
}

// MCP响应类型
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 颜色令牌类型
export interface ColorToken {
  id: string;
  name: string;
  value: string;
  description?: string;
  category?: string;
}

// 排版令牌类型
export interface TypographyToken {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  lineHeight?: number | string;
  letterSpacing?: number;
  textCase?: string;
  textDecoration?: string;
  category?: string;
}

// 间距令牌类型
export interface SpacingToken {
  id: string;
  name: string;
  value: number;
  description?: string;
  category?: string;
}

// 效果令牌类型
export interface EffectToken {
  id: string;
  name: string;
  type: string;
  value: any;
  description?: string;
  category?: string;
}

// 组件令牌类型
export interface ComponentToken {
  id: string;
  name: string;
  description?: string;
  nodeId: string;
  key: string;
  variants?: Record<string, string>;
}

// 设计规范类型
export interface DesignSpec {
  id: string;
  name: string;
  description?: string;
  version: string;
  fileId: string;
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  effects: EffectToken[];
  components: ComponentToken[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Figma元素类型
export interface FigmaElement {
  id: string;
  name: string;
  type: string;
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
}

// Figma资源类型
export interface FigmaAsset {
  id: string;
  name: string;
  type: string;
  url?: string;
  nodeId?: string;
  fileId?: string;
}

// 通道状态类型
export interface ChannelStatus {
  id: string;
  connected: boolean;
  clientCount: number;
  lastActivity: string | Date;
} 