/**
 * Figma设计规范令牌类型定义
 */

// 颜色令牌
export interface FigmaColorToken {
  id: string;
  name: string;
  value: string; // 十六进制颜色值
  description?: string;
  alpha?: number; // 透明度
  rgb?: {
    r: number;
    g: number;
    b: number;
  };
  category?: string;
  usageCount?: number;
  nodeIds?: string[];
}

// 排版令牌
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

// 间距令牌
export interface FigmaSpacingToken {
  id: string;
  name: string;
  value: number;
  unit?: string; // px, rem, em等
  description?: string;
  category?: string;
  usageCount?: number;
  nodeIds?: string[];
}

// 效果令牌
export interface FigmaEffectToken {
  id: string;
  name: string;
  type: 'shadow' | 'blur' | 'inner-shadow';
  value: any; // 效果配置
  color?: string;
  offset?: {
    x: number;
    y: number;
  };
  radius?: number;
  spread?: number;
  visible?: boolean;
  blendMode?: string;
  description?: string;
  category?: string;
  usageCount?: number;
  nodeIds?: string[];
}

// 组件令牌
export interface FigmaComponentToken {
  id: string;
  name: string;
  description?: string;
  nodeId: string;
  key: string;
  documentId?: string;
  thumbnail?: string;
  variants?: Record<string, string>;
  usageCount?: number;
  instances?: string[];
  properties?: Record<string, any>;
} 