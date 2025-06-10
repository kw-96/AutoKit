/**
 * Figma工具函数
 */

import { FigmaColorToken, FigmaTypographyToken, FigmaSpacingToken, FigmaEffectToken } from '../types';

/**
 * 将RGB颜色转换为HEX格式
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (value: number): string => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * 将RGBA颜色转换为HEX格式
 */
export const rgbaToHex = (r: number, g: number, b: number, a: number = 1): string => {
  const hex = rgbToHex(r, g, b);
  
  if (a === 1) {
    return hex;
  }
  
  const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `${hex}${alphaHex}`;
};

/**
 * 将HEX颜色转换为RGB格式
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  
  if (!result) {
    return null;
  }
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  };
};

/**
 * 将HEX颜色转换为RGBA格式
 */
export const hexToRgba = (hex: string): { r: number; g: number; b: number; a: number } | null => {
  if (hex.length === 9) {
    // 带Alpha通道的HEX
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    
    if (!result) {
      return null;
    }
    
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
      a: parseInt(result[4], 16) / 255
    };
  }
  
  const rgb = hexToRgb(hex);
  
  if (!rgb) {
    return null;
  }
  
  return {
    ...rgb,
    a: 1
  };
};

/**
 * 生成随机ID
 */
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
};

/**
 * 从Figma节点中提取颜色令牌
 */
export const extractColorTokens = (node: any): FigmaColorToken[] => {
  const colorTokens: FigmaColorToken[] = [];
  
  const processNode = (node: any, path: string = '') => {
    if (!node) return;
    
    // 处理填充
    if (node.fills && Array.isArray(node.fills)) {
      node.fills.forEach((fill: any, index: number) => {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const { r, g, b, a = 1 } = fill.color || {};
          
          if (r !== undefined && g !== undefined && b !== undefined) {
            const hexColor = rgbaToHex(r, g, b, a);
            const name = path ? `${path}/Fill-${index + 1}` : `Fill-${index + 1}`;
            
            colorTokens.push({
              id: generateId(),
              name,
              value: hexColor,
              category: 'fills',
              nodeIds: [node.id]
            });
          }
        }
      });
    }
    
    // 处理描边
    if (node.strokes && Array.isArray(node.strokes)) {
      node.strokes.forEach((stroke: any, index: number) => {
        if (stroke.type === 'SOLID' && stroke.visible !== false) {
          const { r, g, b, a = 1 } = stroke.color || {};
          
          if (r !== undefined && g !== undefined && b !== undefined) {
            const hexColor = rgbaToHex(r, g, b, a);
            const name = path ? `${path}/Stroke-${index + 1}` : `Stroke-${index + 1}`;
            
            colorTokens.push({
              id: generateId(),
              name,
              value: hexColor,
              category: 'strokes',
              nodeIds: [node.id]
            });
          }
        }
      });
    }
    
    // 处理子节点
    if (node.children && Array.isArray(node.children)) {
      const nodeName = node.name || '';
      const newPath = path ? `${path}/${nodeName}` : nodeName;
      
      node.children.forEach((child: any) => {
        processNode(child, newPath);
      });
    }
  };
  
  processNode(node);
  
  return colorTokens;
};

/**
 * 从Figma节点中提取排版令牌
 */
export const extractTypographyTokens = (node: any): FigmaTypographyToken[] => {
  const typographyTokens: FigmaTypographyToken[] = [];
  
  const processNode = (node: any, path: string = '') => {
    if (!node) return;
    
    // 处理文本节点
    if (node.type === 'TEXT') {
      const {
        fontFamily,
        fontSize,
        fontWeight,
        lineHeight,
        letterSpacing,
        textCase,
        textDecoration
      } = node.style || {};
      
      if (fontFamily && fontSize) {
        const name = path ? `${path}/${node.name || 'Text'}` : (node.name || 'Text');
        
        typographyTokens.push({
          id: generateId(),
          name,
          fontFamily,
          fontSize,
          fontWeight: fontWeight || 400,
          lineHeight: lineHeight?.value || 'normal',
          letterSpacing: letterSpacing?.value || 0,
          textCase: textCase || 'none',
          textDecoration: textDecoration || 'none',
          category: 'typography',
          nodeIds: [node.id]
        });
      }
    }
    
    // 处理子节点
    if (node.children && Array.isArray(node.children)) {
      const nodeName = node.name || '';
      const newPath = path ? `${path}/${nodeName}` : nodeName;
      
      node.children.forEach((child: any) => {
        processNode(child, newPath);
      });
    }
  };
  
  processNode(node);
  
  return typographyTokens;
};

/**
 * 从Figma节点中提取间距令牌
 */
export const extractSpacingTokens = (node: any): FigmaSpacingToken[] => {
  const spacingValues = new Set<number>();
  
  const processNode = (node: any) => {
    if (!node) return;
    
    // 处理自动布局
    if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
      if (node.itemSpacing > 0) {
        spacingValues.add(node.itemSpacing);
      }
      
      // 处理内边距
      if (node.paddingLeft > 0) spacingValues.add(node.paddingLeft);
      if (node.paddingRight > 0) spacingValues.add(node.paddingRight);
      if (node.paddingTop > 0) spacingValues.add(node.paddingTop);
      if (node.paddingBottom > 0) spacingValues.add(node.paddingBottom);
    }
    
    // 处理子节点
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        processNode(child);
      });
    }
  };
  
  processNode(node);
  
  // 将收集到的间距值转换为令牌
  const spacingTokens: FigmaSpacingToken[] = [];
  let index = 0;
  
  for (const value of [...spacingValues].sort((a, b) => a - b)) {
    const size = index === 0 ? 'xs' : 
                index === 1 ? 'sm' : 
                index === 2 ? 'md' : 
                index === 3 ? 'lg' : 
                index === 4 ? 'xl' : `${index + 1}x`;
    
    spacingTokens.push({
      id: generateId(),
      name: `spacing-${size}`,
      value,
      description: `间距 ${value}px`,
      category: 'spacing'
    });
    
    index++;
  }
  
  return spacingTokens;
};

/**
 * 从Figma节点中提取效果令牌
 */
export const extractEffectTokens = (node: any): FigmaEffectToken[] => {
  const effectTokens: FigmaEffectToken[] = [];
  
  const processNode = (node: any, path: string = '') => {
    if (!node) return;
    
    // 处理效果
    if (node.effects && Array.isArray(node.effects)) {
      node.effects.forEach((effect: any, index: number) => {
        if (effect.visible !== false) {
          let type: 'shadow' | 'blur' | 'inner-shadow' = 'shadow';
          
          if (effect.type === 'DROP_SHADOW') {
            type = 'shadow';
          } else if (effect.type === 'INNER_SHADOW') {
            type = 'inner-shadow';
          } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
            type = 'blur';
          } else {
            return;
          }
          
          const name = path ? `${path}/${type}-${index + 1}` : `${type}-${index + 1}`;
          
          effectTokens.push({
            id: generateId(),
            name,
            type,
            value: effect,
            category: 'effects',
            nodeIds: [node.id]
          });
        }
      });
    }
    
    // 处理子节点
    if (node.children && Array.isArray(node.children)) {
      const nodeName = node.name || '';
      const newPath = path ? `${path}/${nodeName}` : nodeName;
      
      node.children.forEach((child: any) => {
        processNode(child, newPath);
      });
    }
  };
  
  processNode(node);
  
  return effectTokens;
};

/**
 * 解析组件变体名称
 */
export const parseComponentVariants = (name: string): Record<string, string> => {
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
}; 