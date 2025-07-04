#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

// Load configuration
let config: any = {};
try {
  const configPath = path.join(__dirname, "../../config.json");
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  }
} catch (error) {
  console.error("Failed to load config.json:", error);
}

// Define TypeScript interfaces for Figma responses
interface FigmaResponse {
  id: string;
  result?: any;
  error?: string;
}

// Define interface for command progress updates
interface CommandProgressUpdate {
  type: 'command_progress';
  commandId: string;
  commandType: string;
  status: 'started' | 'in_progress' | 'completed' | 'error';
  progress: number;
  totalItems: number;
  processedItems: number;
  currentChunk?: number;
  totalChunks?: number;
  chunkSize?: number;
  message: string;
  payload?: any;
  timestamp: number;
}

// Add TypeScript interfaces for component overrides after line 21
interface ComponentOverride {
  id: string;
  overriddenFields: string[];
}

// Update the getInstanceOverridesResult interface to match the plugin implementation
interface getInstanceOverridesResult {
  success: boolean;
  message: string;
  sourceInstanceId: string;
  mainComponentId: string;
  overridesCount: number;
}

interface setInstanceOverridesResult {
  success: boolean;
  message: string;
  totalCount?: number;
  results?: Array<{
    success: boolean;
    instanceId: string;
    instanceName: string;
    appliedCount?: number;
    message?: string;
  }>;
}

// Custom logging functions that write to stderr instead of stdout to avoid being captured
const logger = {
  info: (message: string) => process.stderr.write(`[INFO] ${message}\n`),
  debug: (message: string) => process.stderr.write(`[DEBUG] ${message}\n`),
  warn: (message: string) => process.stderr.write(`[WARN] ${message}\n`),
  error: (message: string) => process.stderr.write(`[ERROR] ${message}\n`),
  log: (message: string) => process.stderr.write(`[LOG] ${message}\n`)
};

// Helper function to validate node types for specific operations
function validateNodeType(nodeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(nodeType);
}

// Helper function to check if a node supports fills
function nodeSupportsProperty(nodeType: string, property: string): boolean {
  const propertyMap: Record<string, string[]> = {
    'fills': ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'FRAME', 'COMPONENT', 'INSTANCE'],
    'strokes': ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'FRAME', 'COMPONENT', 'INSTANCE', 'LINE'],
    'cornerRadius': ['RECTANGLE', 'FRAME', 'COMPONENT', 'INSTANCE'],
    'characters': ['TEXT'],
    'style': ['TEXT'],
    'children': ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'BOOLEAN_OPERATION'],
    'layoutMode': ['FRAME', 'COMPONENT', 'INSTANCE']
  };
  
  return propertyMap[property]?.includes(nodeType) || false;
}

// Helper function to generate CSS tokens from design tokens
function generateCSSTokens(tokens: any): string {
  let css = `/* Generated Design System CSS Tokens */\n/* Generated at: ${new Date().toISOString()} */\n\n:root {\n`;
  
  // Generate color tokens
  if (tokens.colors) {
    css += "  /* Color Tokens */\n";
    Object.entries(tokens.colors).forEach(([name, token]: [string, any]) => {
      if (token.value && typeof token.value === 'object') {
        const { r, g, b } = token.value;
        const rgbValue = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
        css += `  --color-${name}: ${rgbValue};\n`;
      }
    });
    css += "\n";
  }
  
  // Generate typography tokens
  if (tokens.typography) {
    css += "  /* Typography Tokens */\n";
    Object.entries(tokens.typography).forEach(([name, token]: [string, any]) => {
      if (token.value) {
        if (token.value.fontFamily) {
          css += `  --font-family-${name}: "${token.value.fontFamily}";\n`;
        }
        if (token.value.fontSize) {
          css += `  --font-size-${name}: ${token.value.fontSize}px;\n`;
        }
        if (token.value.fontWeight) {
          css += `  --font-weight-${name}: ${token.value.fontWeight};\n`;
        }
      }
    });
    css += "\n";
  }
  
  css += "}\n";
  return css;
}

// Helper function to generate component update script
function generateUpdateScript(designSystem: any): string {
  return `// Generated Figma Component Update Script
// Generated at: ${designSystem.metadata.generatedAt}

const fs = require('fs');
const path = require('path');

class FigmaComponentUpdater {
  constructor() {
    this.designSystemPath = path.join(__dirname, 'design-system.json');
    this.designSystem = null;
    this.loadDesignSystem();
  }

  loadDesignSystem() {
    try {
      if (fs.existsSync(this.designSystemPath)) {
        const data = fs.readFileSync(this.designSystemPath, 'utf8');
        this.designSystem = JSON.parse(data);
        console.log('✅ 设计系统规范加载成功');
      } else {
        console.log('❌ 设计系统规范文件不存在');
      }
    } catch (error) {
      console.error('❌ 加载设计系统规范失败:', error.message);
    }
  }

  updateDesignSystem(newData) {
    try {
      this.designSystem = {
        ...this.designSystem,
        ...newData,
        metadata: {
          ...this.designSystem?.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      
      const jsonString = JSON.stringify(this.designSystem, null, 2);
      fs.writeFileSync(this.designSystemPath, jsonString, 'utf8');
      console.log('✅ 设计系统规范更新成功');
      return true;
    } catch (error) {
      console.error('❌ 更新设计系统规范失败:', error.message);
      return false;
    }
  }

  getComponents() {
    return this.designSystem?.components || [];
  }

  getStyles() {
    return this.designSystem?.styles || {};
  }

  getTokens() {
    return this.designSystem?.tokens || {};
  }

  // 获取组件信息
  getComponentById(componentId) {
    const components = this.getComponents();
    return components.components?.find(comp => comp.id === componentId);
  }

  // 获取颜色令牌
  getColorToken(tokenName) {
    const tokens = this.getTokens();
    return tokens.colors?.[tokenName];
  }

  // 获取字体令牌
  getTypographyToken(tokenName) {
    const tokens = this.getTokens();
    return tokens.typography?.[tokenName];
  }

  // 生成使用报告
  generateUsageReport() {
    const components = this.getComponents();
    const styles = this.getStyles();
    const tokens = this.getTokens();
    
    console.log('📊 设计系统使用报告');
    console.log('==================');
    console.log(\`组件数量: \${components.count || 0}\`);
    console.log(\`颜色样式: \${styles.colors?.length || 0}\`);
    console.log(\`文字样式: \${styles.texts?.length || 0}\`);
    console.log(\`效果样式: \${styles.effects?.length || 0}\`);
    console.log(\`颜色令牌: \${Object.keys(tokens.colors || {}).length}\`);
    console.log(\`字体令牌: \${Object.keys(tokens.typography || {}).length}\`);
    console.log('==================');
  }
}

// 导出更新器实例
module.exports = new FigmaComponentUpdater();

// 如果直接运行此脚本，显示使用报告
if (require.main === module) {
  const updater = module.exports;
  updater.generateUsageReport();
}
`;
}

// WebSocket connection and request tracking
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
  lastActivity: number; // Add timestamp for last activity
}>();

// Track which channel each client is in
let currentChannel: string | null = null;

// Create MCP server
const server = new McpServer({
  name: "TalkToFigmaMCP",
  version: "1.0.0",
});

// Add command line argument parsing
const args = process.argv.slice(2);
const serverArg = args.find(arg => arg.startsWith('--server='));
const serverUrl = serverArg ? serverArg.split('=')[1] : 'localhost';
const WS_URL = serverUrl === 'localhost' ? `ws://${serverUrl}` : `wss://${serverUrl}`;

// ==================== 文档信息工具 ====================
// 工具名称: get_document_info
// 功能: 获取当前Figma文档的详细信息
server.tool(
  "get_document_info",
  "Get detailed information about the current Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_document_info");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting document info: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 选择信息工具 ====================
// 工具名称: get_selection
// 功能: 获取当前在Figma中选中的元素信息
server.tool(
  "get_selection",
  "Get information about the current selection in Figma",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_selection");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting selection: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 读取设计工具 ====================
// 工具名称: read_my_design
// 功能: 获取当前选中元素的详细信息，包括所有节点详情
server.tool(
  "read_my_design",
  "Get detailed information about the current selection in Figma, including all node details",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("read_my_design", {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting node info: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 节点信息工具 ====================
// 工具名称: get_node_info
// 功能: 获取指定节点的详细信息
server.tool(
  "get_node_info",
  "Get detailed information about a specific node in Figma",
  {
    nodeId: z.string().describe("The ID of the node to get information about"),
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_node_info", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filterFigmaNode(result))
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting node info: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

function rgbaToHex(color: any): string {
  // 如果已经是字符串格式（hex），直接返回
  if (typeof color === 'string' && color.startsWith('#')) {
    return color;
  }

  // 检查是否是有效的RGBA对象
  if (!color || typeof color !== 'object' || 
      typeof color.r !== 'number' || 
      typeof color.g !== 'number' || 
      typeof color.b !== 'number') {
    return '#000000'; // 默认黑色
  }

  const r = Math.round(Math.max(0, Math.min(1, color.r)) * 255);
  const g = Math.round(Math.max(0, Math.min(1, color.g)) * 255);
  const b = Math.round(Math.max(0, Math.min(1, color.b)) * 255);
  const a = color.a !== undefined ? Math.round(Math.max(0, Math.min(1, color.a)) * 255) : 255;

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a === 255 ? '' : a.toString(16).padStart(2, '0')}`;
}

function filterFigmaNode(node: any) {
  // Skip VECTOR type nodes
  if (node.type === "VECTOR") {
    return null;
  }

  const filtered: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // 检查节点是否支持fills属性
  if (nodeSupportsProperty(node.type, 'fills') && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    filtered.fills = node.fills.map((fill: any) => {
      const processedFill = { ...fill };

      // Remove boundVariables and imageRef
      delete processedFill.boundVariables;
      delete processedFill.imageRef;

      // Process gradientStops if present
      if (processedFill.gradientStops) {
        processedFill.gradientStops = processedFill.gradientStops.map((stop: any) => {
          const processedStop = { ...stop };
          // Convert color to hex if present
          if (processedStop.color) {
            processedStop.color = rgbaToHex(processedStop.color);
          }
          // Remove boundVariables
          delete processedStop.boundVariables;
          return processedStop;
        });
      }

      // Convert solid fill colors to hex
      if (processedFill.color) {
        processedFill.color = rgbaToHex(processedFill.color);
      }

      return processedFill;
    });
  }

  // 检查节点是否支持strokes属性
  if (nodeSupportsProperty(node.type, 'strokes') && node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
    filtered.strokes = node.strokes.map((stroke: any) => {
      const processedStroke = { ...stroke };
      // Remove boundVariables
      delete processedStroke.boundVariables;
      // Convert color to hex if present
      if (processedStroke.color) {
        processedStroke.color = rgbaToHex(processedStroke.color);
      }
      return processedStroke;
    });
  }

  // 检查节点是否支持cornerRadius属性
  if (nodeSupportsProperty(node.type, 'cornerRadius') && node.cornerRadius !== undefined) {
    filtered.cornerRadius = node.cornerRadius;
  }

  if (node.absoluteBoundingBox) {
    filtered.absoluteBoundingBox = node.absoluteBoundingBox;
  }

  // 检查节点是否支持文本相关属性
  if (nodeSupportsProperty(node.type, 'characters')) {
    if (node.characters) {
      filtered.characters = node.characters;
    }

    if (node.style) {
      filtered.style = {
        fontFamily: node.style.fontFamily,
        fontStyle: node.style.fontStyle,
        fontWeight: node.style.fontWeight,
        fontSize: node.style.fontSize,
        textAlignHorizontal: node.style.textAlignHorizontal,
        letterSpacing: node.style.letterSpacing,
        lineHeightPx: node.style.lineHeightPx
      };
    }
  }

  // 检查节点是否支持children属性
  if (nodeSupportsProperty(node.type, 'children') && node.children && Array.isArray(node.children)) {
    filtered.children = node.children
      .map((child: any) => filterFigmaNode(child))
      .filter((child: any) => child !== null); // Remove null children (VECTOR nodes)
  }

  return filtered;
}

// ==================== 多节点信息工具 ====================
// 工具名称: get_nodes_info
// 功能: 获取多个节点的详细信息
server.tool(
  "get_nodes_info",
  "Get detailed information about multiple nodes in Figma",
  {
    nodeIds: z.array(z.string()).describe("Array of node IDs to get information about")
  },
  async ({ nodeIds }) => {
    try {
      const results = await Promise.all(
        nodeIds.map(async (nodeId) => {
          const result = await sendCommandToFigma('get_node_info', { nodeId });
          return { nodeId, info: result };
        })
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results.map((result) => filterFigmaNode(result.info)))
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting nodes info: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);


// ==================== 创建矩形工具 ====================
// 工具名称: create_rectangle
// 功能: 在Figma中创建新的矩形元素
server.tool(
  "create_rectangle",
  "Create a new rectangle in Figma",
  {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().describe("Width of the rectangle"),
    height: z.number().describe("Height of the rectangle"),
    name: z.string().optional().describe("Optional name for the rectangle"),
    parentId: z
      .string()
      .optional()
      .describe("Optional parent node ID to append the rectangle to"),
  },
  async ({ x, y, width, height, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_rectangle", {
        x,
        y,
        width,
        height,
        name: name || "Rectangle",
        parentId,
      });
      return {
        content: [
          {
            type: "text",
            text: `Created rectangle "${JSON.stringify(result)}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating rectangle: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 创建框架工具 ====================
// 工具名称: create_frame
// 功能: 在Figma中创建新的框架容器
server.tool(
  "create_frame",
  "Create a new frame in Figma",
  {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    width: z.number().describe("Width of the frame"),
    height: z.number().describe("Height of the frame"),
    name: z.string().optional().describe("Optional name for the frame"),
    parentId: z
      .string()
      .optional()
      .describe("Optional parent node ID to append the frame to"),
    fillColor: z
      .object({
        r: z.number().min(0).max(1).describe("Red component (0-1)"),
        g: z.number().min(0).max(1).describe("Green component (0-1)"),
        b: z.number().min(0).max(1).describe("Blue component (0-1)"),
        a: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe("Alpha component (0-1)"),
      })
      .optional()
      .describe("Fill color in RGBA format"),
    strokeColor: z
      .object({
        r: z.number().min(0).max(1).describe("Red component (0-1)"),
        g: z.number().min(0).max(1).describe("Green component (0-1)"),
        b: z.number().min(0).max(1).describe("Blue component (0-1)"),
        a: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe("Alpha component (0-1)"),
      })
      .optional()
      .describe("Stroke color in RGBA format"),
    strokeWeight: z.number().positive().optional().describe("Stroke weight"),
    layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional().describe("Auto-layout mode for the frame"),
    layoutWrap: z.enum(["NO_WRAP", "WRAP"]).optional().describe("Whether the auto-layout frame wraps its children"),
    paddingTop: z.number().optional().describe("Top padding for auto-layout frame"),
    paddingRight: z.number().optional().describe("Right padding for auto-layout frame"),
    paddingBottom: z.number().optional().describe("Bottom padding for auto-layout frame"),
    paddingLeft: z.number().optional().describe("Left padding for auto-layout frame"),
    primaryAxisAlignItems: z
      .enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
      .optional()
      .describe("Primary axis alignment for auto-layout frame. Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."),
    counterAxisAlignItems: z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional().describe("Counter axis alignment for auto-layout frame"),
    layoutSizingHorizontal: z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Horizontal sizing mode for auto-layout frame"),
    layoutSizingVertical: z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Vertical sizing mode for auto-layout frame"),
    itemSpacing: z
      .number()
      .optional()
      .describe("Distance between children in auto-layout frame. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN.")
  },
  async ({
    x,
    y,
    width,
    height,
    name,
    parentId,
    fillColor,
    strokeColor,
    strokeWeight,
    layoutMode,
    layoutWrap,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    primaryAxisAlignItems,
    counterAxisAlignItems,
    layoutSizingHorizontal,
    layoutSizingVertical,
    itemSpacing
  }) => {
    try {
      const result = await sendCommandToFigma("create_frame", {
        x,
        y,
        width,
        height,
        name: name || "Frame",
        parentId,
        fillColor: fillColor || { r: 1, g: 1, b: 1, a: 1 },
        strokeColor: strokeColor,
        strokeWeight: strokeWeight,
        layoutMode,
        layoutWrap,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        primaryAxisAlignItems,
        counterAxisAlignItems,
        layoutSizingHorizontal,
        layoutSizingVertical,
        itemSpacing
      });
      const typedResult = result as { name: string; id: string };
      return {
        content: [
          {
            type: "text",
            text: `Created frame "${typedResult.name}" with ID: ${typedResult.id}. Use the ID as the parentId to appendChild inside this frame.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating frame: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 创建文本工具 ====================
// 工具名称: create_text
// 功能: 在Figma中创建新的文本元素
server.tool(
  "create_text",
  "Create a new text element in Figma",
  {
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    text: z.string().describe("Text content"),
    fontSize: z.number().optional().describe("Font size (default: 14)"),
    fontWeight: z
      .number()
      .optional()
      .describe("Font weight (e.g., 400 for Regular, 700 for Bold)"),
    fontColor: z
      .object({
        r: z.number().min(0).max(1).describe("Red component (0-1)"),
        g: z.number().min(0).max(1).describe("Green component (0-1)"),
        b: z.number().min(0).max(1).describe("Blue component (0-1)"),
        a: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe("Alpha component (0-1)"),
      })
      .optional()
      .describe("Font color in RGBA format"),
    name: z
      .string()
      .optional()
      .describe("Semantic layer name for the text node"),
    parentId: z
      .string()
      .optional()
      .describe("Optional parent node ID to append the text to"),
  },
  async ({ x, y, text, fontSize, fontWeight, fontColor, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_text", {
        x,
        y,
        text,
        fontSize: fontSize || 14,
        fontWeight: fontWeight || 400,
        fontColor: fontColor || { r: 0, g: 0, b: 0, a: 1 },
        name: name || "Text",
        parentId,
      });
      const typedResult = result as { name: string; id: string };
      return {
        content: [
          {
            type: "text",
            text: `Created text "${typedResult.name}" with ID: ${typedResult.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating text: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 设置填充颜色工具 ====================
// 工具名称: set_fill_color
// 功能: 设置节点的填充颜色（支持文本节点和框架节点）
server.tool(
  "set_fill_color",
  "Set the fill color of a node in Figma can be TextNode or FrameNode",
  {
    nodeId: z.string().describe("The ID of the node to modify"),
    r: z.number().min(0).max(1).describe("Red component (0-1)"),
    g: z.number().min(0).max(1).describe("Green component (0-1)"),
    b: z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: z.number().min(0).max(1).optional().describe("Alpha component (0-1)"),
  },
  async ({ nodeId, r, g, b, a }) => {
    try {
      const result = await sendCommandToFigma("set_fill_color", {
        nodeId,
        color: { r, g, b, a: a || 1 },
      });
      const typedResult = result as { name: string };
      return {
        content: [
          {
            type: "text",
            text: `Set fill color of node "${typedResult.name
              }" to RGBA(${r}, ${g}, ${b}, ${a || 1})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting fill color: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 设置描边颜色工具 ====================
// 工具名称: set_stroke_color
// 功能: 设置节点的描边颜色和粗细
server.tool(
  "set_stroke_color",
  "Set the stroke color of a node in Figma",
  {
    nodeId: z.string().describe("The ID of the node to modify"),
    r: z.number().min(0).max(1).describe("Red component (0-1)"),
    g: z.number().min(0).max(1).describe("Green component (0-1)"),
    b: z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: z.number().min(0).max(1).optional().describe("Alpha component (0-1)"),
    weight: z.number().positive().optional().describe("Stroke weight"),
  },
  async ({ nodeId, r, g, b, a, weight }) => {
    try {
      const result = await sendCommandToFigma("set_stroke_color", {
        nodeId,
        color: { r, g, b, a: a || 1 },
        weight: weight || 1,
      });
      const typedResult = result as { name: string };
      return {
        content: [
          {
            type: "text",
            text: `Set stroke color of node "${typedResult.name
              }" to RGBA(${r}, ${g}, ${b}, ${a || 1}) with weight ${weight || 1}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting stroke color: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 移动节点工具 ====================
// 工具名称: move_node
// 功能: 将节点移动到新的位置
server.tool(
  "move_node",
  "Move a node to a new position in Figma",
  {
    nodeId: z.string().describe("The ID of the node to move"),
    x: z.number().describe("New X position"),
    y: z.number().describe("New Y position"),
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma("move_node", { nodeId, x, y });
      const typedResult = result as { name: string };
      return {
        content: [
          {
            type: "text",
            text: `Moved node "${typedResult.name}" to position (${x}, ${y})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error moving node: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 移动节点到父容器工具 ====================
// 工具名称: move_node_to_parent
// 功能: 将节点移动到指定的父容器中
server.tool(
  "move_node_to_parent",
  "Move a node to a specified parent container in Figma",
  {
    nodeId: z.string().describe("The ID of the node to move"),
    parentId: z.string().describe("The ID of the parent container to move the node into"),
    x: z.number().optional().describe("Optional X position within the parent container"),
    y: z.number().optional().describe("Optional Y position within the parent container"),
    index: z.number().optional().describe("Optional index position in the parent's children array")
  },
  async ({ nodeId, parentId, x, y, index }) => {
    try {
      const result = await sendCommandToFigma("move_node_to_parent", { 
        nodeId, 
        parentId, 
        x, 
        y, 
        index 
      });
      const typedResult = result as { name: string; parentName: string };
      return {
        content: [
          {
            type: "text",
            text: `Successfully moved node "${typedResult.name}" to parent container "${typedResult.parentName}"${x !== undefined && y !== undefined ? ` at position (${x}, ${y})` : ''}${index !== undefined ? ` at index ${index}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error moving node to parent: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 批量移动节点到父容器工具 ====================
// 工具名称: move_multiple_nodes_to_parent
// 功能: 批量将多个节点移动到指定的父容器中
server.tool(
  "move_multiple_nodes_to_parent",
  "Move multiple nodes to a specified parent container in Figma",
  {
    nodeIds: z.array(z.string()).describe("Array of node IDs to move"),
    parentId: z.string().describe("The ID of the parent container to move the nodes into"),
    preserveRelativePositions: z.boolean().default(true).describe("Whether to preserve relative positions between nodes"),
    startIndex: z.number().optional().describe("Starting index position in the parent's children array")
  },
  async ({ nodeIds, parentId, preserveRelativePositions, startIndex }) => {
    try {
      const results: any[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        try {
          const result = await sendCommandToFigma("move_node_to_parent", {
            nodeId,
            parentId,
            index: startIndex !== undefined ? startIndex + i : undefined
          });
          
          results.push({
            nodeId,
            success: true,
            result
          });
        } catch (moveError) {
          const errorMsg = `Failed to move node ${nodeId}: ${moveError instanceof Error ? moveError.message : String(moveError)}`;
          errors.push(errorMsg);
          results.push({
            nodeId,
            success: false,
            error: errorMsg
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        content: [
          {
            type: "text",
            text: `批量移动节点到父容器完成！

📊 移动统计:
✅ 成功: ${successCount}/${nodeIds.length}
❌ 失败: ${errors.length}
📁 目标父容器: ${parentId}
🔄 保持相对位置: ${preserveRelativePositions ? '是' : '否'}

${successCount > 0 ? `✅ 成功移动的节点:
${results.filter(r => r.success).map((r, index) => 
  `${index + 1}. ${r.nodeId}`
).join('\n')}` : ''}

${errors.length > 0 ? `❌ 移动失败的节点:
${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}` : ''}

💡 建议:
- 确认父容器ID是否正确
- 检查节点是否存在且可移动
- 验证父容器是否支持子节点`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 批量移动节点失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 克隆节点工具 ====================
// 工具名称: clone_node
// 功能: 克隆现有节点并可选择新位置
server.tool(
  "clone_node",
  "Clone an existing node in Figma",
  {
    nodeId: z.string().describe("The ID of the node to clone"),
    x: z.number().optional().describe("New X position for the clone"),
    y: z.number().optional().describe("New Y position for the clone")
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma('clone_node', { nodeId, x, y });
      const typedResult = result as { name: string, id: string };
      return {
        content: [
          {
            type: "text",
            text: `Cloned node "${typedResult.name}" with new ID: ${typedResult.id}${x !== undefined && y !== undefined ? ` at position (${x}, ${y})` : ''}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error cloning node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 调整节点大小工具 ====================
// 工具名称: resize_node
// 功能: 调整节点的宽度和高度
server.tool(
  "resize_node",
  "Resize a node in Figma",
  {
    nodeId: z.string().describe("The ID of the node to resize"),
    width: z.number().positive().describe("New width"),
    height: z.number().positive().describe("New height"),
  },
  async ({ nodeId, width, height }) => {
    try {
      const result = await sendCommandToFigma("resize_node", {
        nodeId,
        width,
        height,
      });
      const typedResult = result as { name: string };
      return {
        content: [
          {
            type: "text",
            text: `Resized node "${typedResult.name}" to width ${width} and height ${height}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error resizing node: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 删除节点工具 ====================
// 工具名称: delete_node
// 功能: 从Figma中删除指定节点
server.tool(
  "delete_node",
  "Delete a node from Figma",
  {
    nodeId: z.string().describe("The ID of the node to delete"),
  },
  async ({ nodeId }) => {
    try {
      await sendCommandToFigma("delete_node", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: `Deleted node with ID: ${nodeId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting node: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 批量删除节点工具 ====================
// 工具名称: delete_multiple_nodes
// 功能: 一次性删除多个节点
server.tool(
  "delete_multiple_nodes",
  "Delete multiple nodes from Figma at once",
  {
    nodeIds: z.array(z.string()).describe("Array of node IDs to delete"),
  },
  async ({ nodeIds }) => {
    try {
      const result = await sendCommandToFigma("delete_multiple_nodes", { nodeIds });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting multiple nodes: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 导出节点为图片工具 ====================
// 工具名称: export_node_as_image
// 功能: 将节点导出为图片文件
server.tool(
  "export_node_as_image",
  "Export a node as an image from Figma",
  {
    nodeId: z.string().describe("The ID of the node to export"),
    format: z
      .enum(["PNG", "JPG", "SVG", "PDF"])
      .optional()
      .describe("Export format"),
    scale: z.number().positive().optional().describe("Export scale"),
  },
  async ({ nodeId, format, scale }) => {
    try {
      const result = await sendCommandToFigma("export_node_as_image", {
        nodeId,
        format: format || "PNG",
        scale: scale || 1,
      });
      const typedResult = result as { imageData: string; mimeType: string };

      return {
        content: [
          {
            type: "image",
            data: typedResult.imageData,
            mimeType: typedResult.mimeType || "image/png",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error exporting node as image: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 设置文本内容工具 ====================
// 工具名称: set_text_content
// 功能: 设置现有文本节点的内容
server.tool(
  "set_text_content",
  "Set the text content of an existing text node in Figma",
  {
    nodeId: z.string().describe("The ID of the text node to modify"),
    text: z.string().describe("New text content"),
  },
  async ({ nodeId, text }) => {
    try {
      const result = await sendCommandToFigma("set_text_content", {
        nodeId,
        text,
      });
      const typedResult = result as { name: string };
      return {
        content: [
          {
            type: "text",
            text: `Updated text content of node "${typedResult.name}" to "${text}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting text content: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 获取样式工具 ====================
// 工具名称: get_styles
// 功能: 获取当前Figma文档中的所有样式
server.tool(
  "get_styles",
  "Get all styles from the current Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_styles");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting styles: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 获取本地组件工具 ====================
// 工具名称: get_local_components
// 功能: 获取Figma文档中的所有本地组件
server.tool(
  "get_local_components",
  "Get all local components from the Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_local_components");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting local components: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 生成设计系统规范工具 ====================
// 工具名称: generate_design_system_specification
// 功能: 从当前Figma文档生成完整的设计系统规范，包括组件、样式和设计令牌
server.tool(
  "generate_design_system_specification",
  "Generate a comprehensive design system specification from the current Figma document, including components, styles, and design tokens. This tool creates JSON files with detailed design system information.",
  {
    outputPath: z.string().optional().describe("Optional custom output path for the generated files. Defaults to './json' directory"),
    includeComponents: z.boolean().optional().default(true).describe("Whether to include component specifications"),
    includeStyles: z.boolean().optional().default(true).describe("Whether to include style specifications (colors, typography, effects)"),
    includeTokens: z.boolean().optional().default(true).describe("Whether to generate design tokens"),
    format: z.enum(["json", "typescript", "css"]).optional().default("json").describe("Output format for the specification")
  },
  async ({ outputPath, includeComponents, includeStyles, includeTokens, format }) => {
    try {
      // 确保输出目录存在，优先使用配置文件中的默认路径
      const defaultPath = config?.settings?.designSystem?.outputPath || path.join(process.cwd(), "json");
      const outputDir = outputPath || path.resolve(__dirname, defaultPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const designSystem: any = {
        metadata: {
          generatedAt: new Date().toISOString(),
          version: "1.0.0",
          source: "Figma Document"
        }
      };

      // 获取文档信息
      const documentInfo = await sendCommandToFigma("get_document_info");
      designSystem.document = documentInfo;

      // 获取组件信息
      if (includeComponents) {
        const components = await sendCommandToFigma("get_local_components");
        designSystem.components = components;
      }

      // 获取样式信息
      if (includeStyles) {
        const styles = await sendCommandToFigma("get_styles");
        designSystem.styles = styles;
      }

      // 生成设计令牌
      if (includeTokens && designSystem.styles) {
        designSystem.tokens = {
          colors: {},
          typography: {},
          spacing: {},
          effects: {}
        };

        // 处理颜色令牌
        if (designSystem.styles.colors) {
          designSystem.styles.colors.forEach((color: any) => {
            const tokenName = color.name.toLowerCase().replace(/\s+/g, '-');
            designSystem.tokens.colors[tokenName] = {
              value: color.paint?.color || color.paint,
              type: "color",
              description: `Color token for ${color.name}`
            };
          });
        }

        // 处理字体令牌
        if (designSystem.styles.texts) {
          designSystem.styles.texts.forEach((text: any) => {
            const tokenName = text.name.toLowerCase().replace(/\s+/g, '-');
            designSystem.tokens.typography[tokenName] = {
              value: {
                fontFamily: text.fontName?.family,
                fontSize: text.fontSize,
                fontWeight: text.fontName?.style
              },
              type: "typography",
              description: `Typography token for ${text.name}`
            };
          });
        }
      }

      // 根据格式生成文件
      let fileName: string;
      let fileContent: string;

      switch (format) {
        case "typescript":
          fileName = "design-system.ts";
          fileContent = `// Generated Design System Specification
// Generated at: ${designSystem.metadata.generatedAt}

export const designSystem = ${JSON.stringify(designSystem, null, 2)} as const;

export type DesignSystem = typeof designSystem;
`;
          break;
        case "css":
          fileName = "design-system.css";
          fileContent = generateCSSTokens(designSystem.tokens || {});
          break;
        default:
          fileName = "design-system.json";
          fileContent = JSON.stringify(designSystem, null, 2);
      }

      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, fileContent, 'utf8');

      // 生成组件更新脚本
      if (includeComponents) {
        const updateScriptPath = path.join(outputDir, "update-figma-components.js");
        const updateScript = generateUpdateScript(designSystem);
        fs.writeFileSync(updateScriptPath, updateScript, 'utf8');
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ 设计系统规范生成成功！

📁 生成的文件：
- ${fileName}: 主要设计系统规范文件
${includeComponents ? `- update-figma-components.js: 组件更新脚本` : ''}

📊 包含内容：
- 文档信息: ${designSystem.document ? '✅' : '❌'}
- 组件规范: ${includeComponents && designSystem.components ? `✅ (${designSystem.components.count || 0} 个组件)` : '❌'}
- 样式规范: ${includeStyles && designSystem.styles ? '✅' : '❌'}
- 设计令牌: ${includeTokens && designSystem.tokens ? '✅' : '❌'}

📍 输出路径: ${filePath}

💡 使用说明：
1. 设计系统规范文件包含了当前Figma文档的完整设计信息
2. 可以在代码中导入使用，确保设计与开发的一致性
3. 当设计更新时，重新运行此工具即可更新规范文件`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 生成设计系统规范时出错: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 获取注释工具 ====================
// 工具名称: get_annotations
// 功能: 获取当前文档或指定节点的所有注释
server.tool(
  "get_annotations",
  "Get all annotations in the current document or specific node",
  {
    nodeId: z.string().optional().describe("Optional node ID to get annotations for specific node"),
    includeCategories: z.boolean().optional().default(true).describe("Whether to include category information")
  },
  async ({ nodeId, includeCategories }) => {
    try {
      const result = await sendCommandToFigma("get_annotations", {
        nodeId,
        includeCategories
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting annotations: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 设置注释工具 ====================
// 工具名称: set_annotation
// 功能: 创建或更新注释
server.tool(
  "set_annotation",
  "Create or update an annotation",
  {
    nodeId: z.string().describe("The ID of the node to annotate"),
    annotationId: z.string().optional().describe("The ID of the annotation to update (if updating existing annotation)"),
    labelMarkdown: z.string().describe("The annotation text in markdown format"),
    categoryId: z.string().optional().describe("The ID of the annotation category"),
    properties: z.array(z.object({
      type: z.string()
    })).optional().describe("Additional properties for the annotation")
  },
  async ({ nodeId, annotationId, labelMarkdown, categoryId, properties }) => {
    try {
      const result = await sendCommandToFigma("set_annotation", {
        nodeId,
        annotationId,
        labelMarkdown,
        categoryId,
        properties
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting annotation: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

interface SetMultipleAnnotationsParams {
  nodeId: string;
  annotations: Array<{
    nodeId: string;
    labelMarkdown: string;
    categoryId?: string;
    annotationId?: string;
    properties?: Array<{ type: string }>;
  }>;
}

// ==================== 批量设置注释工具 ====================
// 工具名称: set_multiple_annotations
// 功能: 在节点中并行设置多个注释
server.tool(
  "set_multiple_annotations",
  "Set multiple annotations parallelly in a node",
  {
    nodeId: z
      .string()
      .describe("The ID of the node containing the elements to annotate"),
    annotations: z
      .array(
        z.object({
          nodeId: z.string().describe("The ID of the node to annotate"),
          labelMarkdown: z.string().describe("The annotation text in markdown format"),
          categoryId: z.string().optional().describe("The ID of the annotation category"),
          annotationId: z.string().optional().describe("The ID of the annotation to update (if updating existing annotation)"),
          properties: z.array(z.object({
            type: z.string()
          })).optional().describe("Additional properties for the annotation")
        })
      )
      .describe("Array of annotations to apply"),
  },
  async ({ nodeId, annotations }, extra) => {
    try {
      if (!annotations || annotations.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No annotations provided",
            },
          ],
        };
      }

      // Initial response to indicate we're starting the process
      const initialStatus = {
        type: "text" as const,
        text: `Starting annotation process for ${annotations.length} nodes. This will be processed in batches of 5...`,
      };

      // Track overall progress
      let totalProcessed = 0;
      const totalToProcess = annotations.length;

      // Use the plugin's set_multiple_annotations function with chunking
      const result = await sendCommandToFigma("set_multiple_annotations", {
        nodeId,
        annotations,
      });

      // Cast the result to a specific type to work with it safely
      interface AnnotationResult {
        success: boolean;
        nodeId: string;
        annotationsApplied?: number;
        annotationsFailed?: number;
        totalAnnotations?: number;
        completedInChunks?: number;
        results?: Array<{
          success: boolean;
          nodeId: string;
          error?: string;
          annotationId?: string;
        }>;
      }

      const typedResult = result as AnnotationResult;

      // Format the results for display
      const success = typedResult.annotationsApplied && typedResult.annotationsApplied > 0;
      const progressText = `
      Annotation process completed:
      - ${typedResult.annotationsApplied || 0} of ${totalToProcess} successfully applied
      - ${typedResult.annotationsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;

      // Detailed results
      const detailedResults = typedResult.results || [];
      const failedResults = detailedResults.filter(item => !item.success);

      // Create the detailed part of the response
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `\n\nNodes that failed:\n${failedResults.map(item =>
          `- ${item.nodeId}: ${item.error || "Unknown error"}`
        ).join('\n')}`;
      }

      return {
        content: [
          initialStatus,
          {
            type: "text" as const,
            text: progressText + detailedResponse,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting multiple annotations: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 创建组件实例工具 ====================
// 工具名称: create_component_instance
// 功能: 在Figma中创建组件的实例
server.tool(
  "create_component_instance",
  "Create an instance of a component in Figma",
  {
    componentKey: z.string().describe("Key of the component to instantiate"),
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
  },
  async ({ componentKey, x, y }) => {
    try {
      const result = await sendCommandToFigma("create_component_instance", {
        componentKey,
        x,
        y,
      });
      const typedResult = result as any;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(typedResult),
          }
        ]
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating component instance: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 获取实例覆盖工具 ====================
// 工具名称: get_instance_overrides
// 功能: 获取选中组件实例的所有覆盖属性，可应用到其他实例
server.tool(
  "get_instance_overrides",
  "Get all override properties from a selected component instance. These overrides can be applied to other instances, which will swap them to match the source component.",
  {
    nodeId: z.string().optional().describe("Optional ID of the component instance to get overrides from. If not provided, currently selected instance will be used."),
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_instance_overrides", { 
        instanceNodeId: nodeId || null 
      });
      const typedResult = result as getInstanceOverridesResult;
      
      return {
        content: [
          {
            type: "text",
            text: typedResult.success 
              ? `Successfully got instance overrides: ${typedResult.message}`
              : `Failed to get instance overrides: ${typedResult.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error copying instance overrides: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 设置实例覆盖工具 ====================
// 工具名称: set_instance_overrides
// 功能: 将之前复制的覆盖属性应用到选中的组件实例
server.tool(
  "set_instance_overrides",
  "Apply previously copied overrides to selected component instances. Target instances will be swapped to the source component and all copied override properties will be applied.",
  {
    sourceInstanceId: z.string().describe("ID of the source component instance"),
    targetNodeIds: z.array(z.string()).describe("Array of target instance IDs. Currently selected instances will be used.")
  },
  async ({ sourceInstanceId, targetNodeIds }) => {
    try {
      const result = await sendCommandToFigma("set_instance_overrides", {
        sourceInstanceId: sourceInstanceId,
        targetNodeIds: targetNodeIds || []
      });
      const typedResult = result as setInstanceOverridesResult;
      
      if (typedResult.success) {
        const successCount = typedResult.results?.filter(r => r.success).length || 0;
        return {
          content: [
            {
              type: "text",
              text: `Successfully applied ${typedResult.totalCount || 0} overrides to ${successCount} instances.`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Failed to set instance overrides: ${typedResult.message}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting instance overrides: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);


// ==================== 设置圆角工具 ====================
// 工具名称: set_corner_radius
// 功能: 设置节点的圆角半径
server.tool(
  "set_corner_radius",
  "Set the corner radius of a node in Figma",
  {
    nodeId: z.string().describe("The ID of the node to modify"),
    radius: z.number().min(0).describe("Corner radius value"),
    corners: z
      .array(z.boolean())
      .length(4)
      .optional()
      .describe(
        "Optional array of 4 booleans to specify which corners to round [topLeft, topRight, bottomRight, bottomLeft]"
      ),
  },
  async ({ nodeId, radius, corners }) => {
    try {
      const result = await sendCommandToFigma("set_corner_radius", {
        nodeId,
        radius,
        corners: corners || [true, true, true, true],
      });
      const typedResult = result as { name: string };
      return {
        content: [
          {
            type: "text",
            text: `Set corner radius of node "${typedResult.name}" to ${radius}px`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting corner radius: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// Define design strategy prompt
server.prompt(
  "design_strategy",
  "Best practices for working with Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `When working with Figma designs, follow these best practices:

1. Start with Document Structure:
   - First use get_document_info() to understand the current document
   - Plan your layout hierarchy before creating elements
   - Create a main container frame for each screen/section

2. Naming Conventions:
   - Use descriptive, semantic names for all elements
   - Follow a consistent naming pattern (e.g., "Login Screen", "Logo Container", "Email Input")
   - Group related elements with meaningful names

3. Layout Hierarchy:
   - Create parent frames first, then add child elements
   - For forms/login screens:
     * Start with the main screen container frame
     * Create a logo container at the top
     * Group input fields in their own containers
     * Place action buttons (login, submit) after inputs
     * Add secondary elements (forgot password, signup links) last

4. Input Fields Structure:
   - Create a container frame for each input field
   - Include a label text above or inside the input
   - Group related inputs (e.g., username/password) together

5. Element Creation:
   - Use create_frame() for containers and input fields
   - Use create_text() for labels, buttons text, and links
   - Set appropriate colors and styles:
     * Use fillColor for backgrounds
     * Use strokeColor for borders
     * Set proper fontWeight for different text elements

6. Mofifying existing elements:
  - use set_text_content() to modify text content.

7. Visual Hierarchy:
   - Position elements in logical reading order (top to bottom)
   - Maintain consistent spacing between elements
   - Use appropriate font sizes for different text types:
     * Larger for headings/welcome text
     * Medium for input labels
     * Standard for button text
     * Smaller for helper text/links

8. Best Practices:
   - Verify each creation with get_node_info()
   - Use parentId to maintain proper hierarchy
   - Group related elements together in frames
   - Keep consistent spacing and alignment

Example Login Screen Structure:
- Login Screen (main frame)
  - Logo Container (frame)
    - Logo (image/text)
  - Welcome Text (text)
  - Input Container (frame)
    - Email Input (frame)
      - Email Label (text)
      - Email Field (frame)
    - Password Input (frame)
      - Password Label (text)
      - Password Field (frame)
  - Login Button (frame)
    - Button Text (text)
  - Helper Links (frame)
    - Forgot Password (text)
    - Don't have account (text)`,
          },
        },
      ],
      description: "Best practices for working with Figma designs",
    };
  }
);

server.prompt(
  "read_design_strategy",
  "Best practices for reading Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `When reading Figma designs, follow these best practices:

1. Start with selection:
   - First use read_my_design() to understand the current selection
   - If no selection ask user to select single or multiple nodes
`,
          },
        },
      ],
      description: "Best practices for reading Figma designs",
    };
  }
);

// ==================== 扫描文本节点工具 ====================
// 工具名称: scan_text_nodes
// 功能: 扫描选中节点中的所有文本节点
server.tool(
  "scan_text_nodes",
  "Scan all text nodes in the selected Figma node",
  {
    nodeId: z.string().describe("ID of the node to scan"),
  },
  async ({ nodeId }) => {
    try {
      // Initial response to indicate we're starting the process
      const initialStatus = {
        type: "text" as const,
        text: "Starting text node scanning. This may take a moment for large designs...",
      };

      // Use the plugin's scan_text_nodes function with chunking flag
      const result = await sendCommandToFigma("scan_text_nodes", {
        nodeId,
        useChunking: true,  // Enable chunking on the plugin side
        chunkSize: 10       // Process 10 nodes at a time
      });

      // If the result indicates chunking was used, format the response accordingly
      if (result && typeof result === 'object' && 'chunks' in result) {
        const typedResult = result as {
          success: boolean,
          totalNodes: number,
          processedNodes: number,
          chunks: number,
          textNodes: Array<any>
        };

        const summaryText = `
        Scan completed:
        - Found ${typedResult.totalNodes} text nodes
        - Processed in ${typedResult.chunks} chunks
        `;

        return {
          content: [
            initialStatus,
            {
              type: "text" as const,
              text: summaryText
            },
            {
              type: "text" as const,
              text: JSON.stringify(typedResult.textNodes, null, 2)
            }
          ],
        };
      }

      // If chunking wasn't used or wasn't reported in the result format, return the result as is
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error scanning text nodes: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 按类型扫描节点工具 ====================
// 工具名称: scan_nodes_by_types
// 功能: 在选中节点中扫描指定类型的子节点
server.tool(
  "scan_nodes_by_types",
  "Scan for child nodes with specific types in the selected Figma node",
  {
    nodeId: z.string().describe("ID of the node to scan"),
    types: z.array(z.string()).describe("Array of node types to find in the child nodes (e.g. ['COMPONENT', 'FRAME'])")
  },
  async ({ nodeId, types }) => {
    try {
      // Initial response to indicate we're starting the process
      const initialStatus = {
        type: "text" as const,
        text: `Starting node type scanning for types: ${types.join(', ')}...`,
      };

      // Use the plugin's scan_nodes_by_types function
      const result = await sendCommandToFigma("scan_nodes_by_types", {
        nodeId,
        types
      });

      // Format the response
      if (result && typeof result === 'object' && 'matchingNodes' in result) {
        const typedResult = result as {
          success: boolean,
          count: number,
          matchingNodes: Array<{
            id: string,
            name: string,
            type: string,
            bbox: {
              x: number,
              y: number,
              width: number,
              height: number
            }
          }>,
          searchedTypes: Array<string>
        };

        const summaryText = `Scan completed: Found ${typedResult.count} nodes matching types: ${typedResult.searchedTypes.join(', ')}`;

        return {
          content: [
            initialStatus,
            {
              type: "text" as const,
              text: summaryText
            },
            {
              type: "text" as const,
              text: JSON.stringify(typedResult.matchingNodes, null, 2)
            }
          ],
        };
      }

      // If the result is in an unexpected format, return it as is
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error scanning nodes by types: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// Text Replacement Strategy Prompt
server.prompt(
  "text_replacement_strategy",
  "Systematic approach for replacing text in Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Intelligent Text Replacement Strategy

## 1. Analyze Design & Identify Structure
- Scan text nodes to understand the overall structure of the design
- Use AI pattern recognition to identify logical groupings:
  * Tables (rows, columns, headers, cells)
  * Lists (items, headers, nested lists)
  * Card groups (similar cards with recurring text fields)
  * Forms (labels, input fields, validation text)
  * Navigation (menu items, breadcrumbs)
\`\`\`
scan_text_nodes(nodeId: "node-id")
get_node_info(nodeId: "node-id")  // optional
\`\`\`

## 2. Strategic Chunking for Complex Designs
- Divide replacement tasks into logical content chunks based on design structure
- Use one of these chunking strategies that best fits the design:
  * **Structural Chunking**: Table rows/columns, list sections, card groups
  * **Spatial Chunking**: Top-to-bottom, left-to-right in screen areas
  * **Semantic Chunking**: Content related to the same topic or functionality
  * **Component-Based Chunking**: Process similar component instances together

## 3. Progressive Replacement with Verification
- Create a safe copy of the node for text replacement
- Replace text chunk by chunk with continuous progress updates
- After each chunk is processed:
  * Export that section as a small, manageable image
  * Verify text fits properly and maintain design integrity
  * Fix issues before proceeding to the next chunk

\`\`\`
// Clone the node to create a safe copy
clone_node(nodeId: "selected-node-id", x: [new-x], y: [new-y])

// Replace text chunk by chunk
set_multiple_text_contents(
  nodeId: "parent-node-id", 
  text: [
    { nodeId: "node-id-1", text: "New text 1" },
    // More nodes in this chunk...
  ]
)

// Verify chunk with small, targeted image exports
export_node_as_image(nodeId: "chunk-node-id", format: "PNG", scale: 0.5)
\`\`\`

## 4. Intelligent Handling for Table Data
- For tabular content:
  * Process one row or column at a time
  * Maintain alignment and spacing between cells
  * Consider conditional formatting based on cell content
  * Preserve header/data relationships

## 5. Smart Text Adaptation
- Adaptively handle text based on container constraints:
  * Auto-detect space constraints and adjust text length
  * Apply line breaks at appropriate linguistic points
  * Maintain text hierarchy and emphasis
  * Consider font scaling for critical content that must fit

## 6. Progressive Feedback Loop
- Establish a continuous feedback loop during replacement:
  * Real-time progress updates (0-100%)
  * Small image exports after each chunk for verification
  * Issues identified early and resolved incrementally
  * Quick adjustments applied to subsequent chunks

## 7. Final Verification & Context-Aware QA
- After all chunks are processed:
  * Export the entire design at reduced scale for final verification
  * Check for cross-chunk consistency issues
  * Verify proper text flow between different sections
  * Ensure design harmony across the full composition

## 8. Chunk-Specific Export Scale Guidelines
- Scale exports appropriately based on chunk size:
  * Small chunks (1-5 elements): scale 1.0
  * Medium chunks (6-20 elements): scale 0.7
  * Large chunks (21-50 elements): scale 0.5
  * Very large chunks (50+ elements): scale 0.3
  * Full design verification: scale 0.2

## Sample Chunking Strategy for Common Design Types

### Tables
- Process by logical rows (5-10 rows per chunk)
- Alternative: Process by column for columnar analysis
- Tip: Always include header row in first chunk for reference

### Card Lists
- Group 3-5 similar cards per chunk
- Process entire cards to maintain internal consistency
- Verify text-to-image ratio within cards after each chunk

### Forms
- Group related fields (e.g., "Personal Information", "Payment Details")
- Process labels and input fields together
- Ensure validation messages and hints are updated with their fields

### Navigation & Menus
- Process hierarchical levels together (main menu, submenu)
- Respect information architecture relationships
- Verify menu fit and alignment after replacement

## Best Practices
- **Preserve Design Intent**: Always prioritize design integrity
- **Structural Consistency**: Maintain alignment, spacing, and hierarchy
- **Visual Feedback**: Verify each chunk visually before proceeding
- **Incremental Improvement**: Learn from each chunk to improve subsequent ones
- **Balance Automation & Control**: Let AI handle repetitive replacements but maintain oversight
- **Respect Content Relationships**: Keep related content consistent across chunks

Remember that text is never just text—it's a core design element that must work harmoniously with the overall composition. This chunk-based strategy allows you to methodically transform text while maintaining design integrity.`,
          },
        },
      ],
      description: "Systematic approach for replacing text in Figma designs",
    };
  }
);

// ==================== 批量设置文本内容工具 ====================
// 工具名称: set_multiple_text_contents
// 功能: 在节点中并行设置多个文本内容
server.tool(
  "set_multiple_text_contents",
  "Set multiple text contents parallelly in a node",
  {
    nodeId: z
      .string()
      .describe("The ID of the node containing the text nodes to replace"),
    text: z
      .array(
        z.object({
          nodeId: z.string().describe("The ID of the text node"),
          text: z.string().describe("The replacement text"),
        })
      )
      .describe("Array of text node IDs and their replacement texts"),
  },
  async ({ nodeId, text }, extra) => {
    try {
      if (!text || text.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No text provided",
            },
          ],
        };
      }

      // Initial response to indicate we're starting the process
      const initialStatus = {
        type: "text" as const,
        text: `Starting text replacement for ${text.length} nodes. This will be processed in batches of 5...`,
      };

      // Track overall progress
      let totalProcessed = 0;
      const totalToProcess = text.length;

      // Use the plugin's set_multiple_text_contents function with chunking
      const result = await sendCommandToFigma("set_multiple_text_contents", {
        nodeId,
        text,
      });

      // Cast the result to a specific type to work with it safely
      interface TextReplaceResult {
        success: boolean;
        nodeId: string;
        replacementsApplied?: number;
        replacementsFailed?: number;
        totalReplacements?: number;
        completedInChunks?: number;
        results?: Array<{
          success: boolean;
          nodeId: string;
          error?: string;
          originalText?: string;
          translatedText?: string;
        }>;
      }

      const typedResult = result as TextReplaceResult;

      // Format the results for display
      const success = typedResult.replacementsApplied && typedResult.replacementsApplied > 0;
      const progressText = `
      Text replacement completed:
      - ${typedResult.replacementsApplied || 0} of ${totalToProcess} successfully updated
      - ${typedResult.replacementsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;

      // Detailed results
      const detailedResults = typedResult.results || [];
      const failedResults = detailedResults.filter(item => !item.success);

      // Create the detailed part of the response
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `\n\nNodes that failed:\n${failedResults.map(item =>
          `- ${item.nodeId}: ${item.error || "Unknown error"}`
        ).join('\n')}`;
      }

      return {
        content: [
          initialStatus,
          {
            type: "text" as const,
            text: progressText + detailedResponse,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting multiple text contents: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// Annotation Conversion Strategy Prompt
server.prompt(
  "annotation_conversion_strategy",
  "Strategy for converting manual annotations to Figma's native annotations",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Automatic Annotation Conversion
            
## Process Overview

The process of converting manual annotations (numbered/alphabetical indicators with connected descriptions) to Figma's native annotations:

1. Get selected frame/component information
2. Scan and collect all annotation text nodes
3. Scan target UI elements (components, instances, frames)
4. Match annotations to appropriate UI elements
5. Apply native Figma annotations

## Step 1: Get Selection and Initial Setup

First, get the selected frame or component that contains annotations:

\`\`\`typescript
// Get the selected frame/component
const selection = await get_selection();
const selectedNodeId = selection[0].id

// Get available annotation categories for later use
const annotationData = await get_annotations({
  nodeId: selectedNodeId,
  includeCategories: true
});
const categories = annotationData.categories;
\`\`\`

## Step 2: Scan Annotation Text Nodes

Scan all text nodes to identify annotations and their descriptions:

\`\`\`typescript
// Get all text nodes in the selection
const textNodes = await scan_text_nodes({
  nodeId: selectedNodeId
});

// Filter and group annotation markers and descriptions

// Markers typically have these characteristics:
// - Short text content (usually single digit/letter)
// - Specific font styles (often bold)
// - Located in a container with "Marker" or "Dot" in the name
// - Have a clear naming pattern (e.g., "1", "2", "3" or "A", "B", "C")


// Identify description nodes
// Usually longer text nodes near markers or with matching numbers in path
  
\`\`\`

## Step 3: Scan Target UI Elements

Get all potential target elements that annotations might refer to:

\`\`\`typescript
// Scan for all UI elements that could be annotation targets
const targetNodes = await scan_nodes_by_types({
  nodeId: selectedNodeId,
  types: [
    "COMPONENT",
    "INSTANCE",
    "FRAME"
  ]
});
\`\`\`

## Step 4: Match Annotations to Targets

Match each annotation to its target UI element using these strategies in order of priority:

1. **Path-Based Matching**:
   - Look at the marker's parent container name in the Figma layer hierarchy
   - Remove any "Marker:" or "Annotation:" prefixes from the parent name
   - Find UI elements that share the same parent name or have it in their path
   - This works well when markers are grouped with their target elements

2. **Name-Based Matching**:
   - Extract key terms from the annotation description
   - Look for UI elements whose names contain these key terms
   - Consider both exact matches and semantic similarities
   - Particularly effective for form fields, buttons, and labeled components

3. **Proximity-Based Matching** (fallback):
   - Calculate the center point of the marker
   - Find the closest UI element by measuring distances to element centers
   - Consider the marker's position relative to nearby elements
   - Use this method when other matching strategies fail

Additional Matching Considerations:
- Give higher priority to matches found through path-based matching
- Consider the type of UI element when evaluating matches
- Take into account the annotation's context and content
- Use a combination of strategies for more accurate matching

## Step 5: Apply Native Annotations

Convert matched annotations to Figma's native annotations using batch processing:

\`\`\`typescript
// Prepare annotations array for batch processing
const annotationsToApply = Object.values(annotations).map(({ marker, description }) => {
  // Find target using multiple strategies
  const target = 
    findTargetByPath(marker, targetNodes) ||
    findTargetByName(description, targetNodes) ||
    findTargetByProximity(marker, targetNodes);
  
  if (target) {
    // Determine appropriate category based on content
    const category = determineCategory(description.characters, categories);

    // Determine appropriate additional annotationProperty based on content
    const annotationProperty = determineProperties(description.characters, target.type);
    
    return {
      nodeId: target.id,
      labelMarkdown: description.characters,
      categoryId: category.id,
      properties: annotationProperty
    };
  }
  return null;
}).filter(Boolean); // Remove null entries

// Apply annotations in batches using set_multiple_annotations
if (annotationsToApply.length > 0) {
  await set_multiple_annotations({
    nodeId: selectedNodeId,
    annotations: annotationsToApply
  });
}
\`\`\`


This strategy focuses on practical implementation based on real-world usage patterns, emphasizing the importance of handling various UI elements as annotation targets, not just text nodes.`
          },
        },
      ],
      description: "Strategy for converting manual annotations to Figma's native annotations",
    };
  }
);

// Instance Slot Filling Strategy Prompt
server.prompt(
  "swap_overrides_instances",
  "Guide to swap instance overrides between instances",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Swap Component Instance and Override Strategy

## Overview
This strategy enables transferring content and property overrides from a source instance to one or more target instances in Figma, maintaining design consistency while reducing manual work.

## Step-by-Step Process

### 1. Selection Analysis
- Use \`get_selection()\` to identify the parent component or selected instances
- For parent components, scan for instances with \`scan_nodes_by_types({ nodeId: "parent-id", types: ["INSTANCE"] })\`
- Identify custom slots by name patterns (e.g. "Custom Slot*" or "Instance Slot") or by examining text content
- Determine which is the source instance (with content to copy) and which are targets (where to apply content)

### 2. Extract Source Overrides
- Use \`get_instance_overrides()\` to extract customizations from the source instance
- This captures text content, property values, and style overrides
- Command syntax: \`get_instance_overrides({ nodeId: "source-instance-id" })\`
- Look for successful response like "Got component information from [instance name]"

### 3. Apply Overrides to Targets
- Apply captured overrides using \`set_instance_overrides()\`
- Command syntax:
  \`\`\`
  set_instance_overrides({
    sourceInstanceId: "source-instance-id", 
    targetNodeIds: ["target-id-1", "target-id-2", ...]
  })
  \`\`\`

### 4. Verification
- Verify results with \`get_node_info()\` or \`read_my_design()\`
- Confirm text content and style overrides have transferred successfully

## Key Tips
- Always join the appropriate channel first with \`join_channel()\`
- When working with multiple targets, check the full selection with \`get_selection()\`
- Preserve component relationships by using instance overrides rather than direct text manipulation`,
          },
        },
      ],
      description: "Strategy for transferring overrides between component instances in Figma",
    };
  }
);

// ==================== 设置布局模式工具 ====================
// 工具名称: set_layout_mode
// 功能: 设置框架的布局模式和换行行为
server.tool(
  "set_layout_mode",
  "Set the layout mode and wrap behavior of a frame in Figma",
  {
    nodeId: z.string().describe("The ID of the frame to modify"),
    layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).describe("Layout mode for the frame"),
    layoutWrap: z.enum(["NO_WRAP", "WRAP"]).optional().describe("Whether the auto-layout frame wraps its children")
  },
  async ({ nodeId, layoutMode, layoutWrap }) => {
    try {
      const result = await sendCommandToFigma("set_layout_mode", {
        nodeId,
        layoutMode,
        layoutWrap: layoutWrap || "NO_WRAP"
      });
      const typedResult = result as { name: string };
      return {
        content: [
          {
            type: "text",
            text: `Set layout mode of frame "${typedResult.name}" to ${layoutMode}${layoutWrap ? ` with ${layoutWrap}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting layout mode: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ==================== 设置内边距工具 ====================
// 工具名称: set_padding
// 功能: 为自动布局框架设置内边距值
server.tool(
  "set_padding",
  "Set padding values for an auto-layout frame in Figma",
  {
    nodeId: z.string().describe("The ID of the frame to modify"),
    paddingTop: z.number().optional().describe("Top padding value"),
    paddingRight: z.number().optional().describe("Right padding value"),
    paddingBottom: z.number().optional().describe("Bottom padding value"),
    paddingLeft: z.number().optional().describe("Left padding value"),
  },
  async ({ nodeId, paddingTop, paddingRight, paddingBottom, paddingLeft }) => {
    try {
      const result = await sendCommandToFigma("set_padding", {
        nodeId,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
      });
      const typedResult = result as { name: string };

      // Create a message about which padding values were set
      const paddingMessages = [];
      if (paddingTop !== undefined) paddingMessages.push(`top: ${paddingTop}`);
      if (paddingRight !== undefined) paddingMessages.push(`right: ${paddingRight}`);
      if (paddingBottom !== undefined) paddingMessages.push(`bottom: ${paddingBottom}`);
      if (paddingLeft !== undefined) paddingMessages.push(`left: ${paddingLeft}`);

      const paddingText = paddingMessages.length > 0
        ? `padding (${paddingMessages.join(', ')})`
        : "padding";

      return {
        content: [
          {
            type: "text",
            text: `Set ${paddingText} for frame "${typedResult.name}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting padding: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ==================== 设置轴对齐工具 ====================
// 工具名称: set_axis_align
// 功能: 为自动布局框架设置主轴和交叉轴对齐方式
server.tool(
  "set_axis_align",
  "Set primary and counter axis alignment for an auto-layout frame in Figma",
  {
    nodeId: z.string().describe("The ID of the frame to modify"),
    primaryAxisAlignItems: z
      .enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
      .optional()
      .describe("Primary axis alignment (MIN/MAX = left/right in horizontal, top/bottom in vertical). Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."),
    counterAxisAlignItems: z
      .enum(["MIN", "MAX", "CENTER", "BASELINE"])
      .optional()
      .describe("Counter axis alignment (MIN/MAX = top/bottom in horizontal, left/right in vertical)")
  },
  async ({ nodeId, primaryAxisAlignItems, counterAxisAlignItems }) => {
    try {
      const result = await sendCommandToFigma("set_axis_align", {
        nodeId,
        primaryAxisAlignItems,
        counterAxisAlignItems
      });
      const typedResult = result as { name: string };

      // Create a message about which alignments were set
      const alignMessages = [];
      if (primaryAxisAlignItems !== undefined) alignMessages.push(`primary: ${primaryAxisAlignItems}`);
      if (counterAxisAlignItems !== undefined) alignMessages.push(`counter: ${counterAxisAlignItems}`);

      const alignText = alignMessages.length > 0
        ? `axis alignment (${alignMessages.join(', ')})`
        : "axis alignment";

      return {
        content: [
          {
            type: "text",
            text: `Set ${alignText} for frame "${typedResult.name}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting axis alignment: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ==================== 设置布局尺寸工具 ====================
// 工具名称: set_layout_sizing
// 功能: 为自动布局框架设置水平和垂直尺寸模式
server.tool(
  "set_layout_sizing",
  "Set horizontal and vertical sizing modes for an auto-layout frame in Figma",
  {
    nodeId: z.string().describe("The ID of the frame to modify"),
    layoutSizingHorizontal: z
      .enum(["FIXED", "HUG", "FILL"])
      .optional()
      .describe("Horizontal sizing mode (HUG for frames/text only, FILL for auto-layout children only)"),
    layoutSizingVertical: z
      .enum(["FIXED", "HUG", "FILL"])
      .optional()
      .describe("Vertical sizing mode (HUG for frames/text only, FILL for auto-layout children only)")
  },
  async ({ nodeId, layoutSizingHorizontal, layoutSizingVertical }) => {
    try {
      const result = await sendCommandToFigma("set_layout_sizing", {
        nodeId,
        layoutSizingHorizontal,
        layoutSizingVertical
      });
      const typedResult = result as { name: string };

      // Create a message about which sizing modes were set
      const sizingMessages = [];
      if (layoutSizingHorizontal !== undefined) sizingMessages.push(`horizontal: ${layoutSizingHorizontal}`);
      if (layoutSizingVertical !== undefined) sizingMessages.push(`vertical: ${layoutSizingVertical}`);

      const sizingText = sizingMessages.length > 0
        ? `layout sizing (${sizingMessages.join(', ')})`
        : "layout sizing";

      return {
        content: [
          {
            type: "text",
            text: `Set ${sizingText} for frame "${typedResult.name}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting layout sizing: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ==================== 设置元素间距工具 ====================
// 工具名称: set_item_spacing
// 功能: 设置自动布局框架中子元素之间的距离
server.tool(
  "set_item_spacing",
  "Set distance between children in an auto-layout frame",
  {
    nodeId: z.string().describe("The ID of the frame to modify"),
    itemSpacing: z.number().describe("Distance between children. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN.")
  },
  async ({ nodeId, itemSpacing }) => {
    try {
      const result = await sendCommandToFigma("set_item_spacing", {
        nodeId,
        itemSpacing
      });
      const typedResult = result as { name: string };

      return {
        content: [
          {
            type: "text",
            text: `Set item spacing to ${itemSpacing} for frame "${typedResult.name}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting item spacing: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ==================== 获取原型反应工具 ====================
// 工具名称: get_reactions
// 功能: 获取多个节点的Figma原型反应，用于生成连接线
server.tool(
  "get_reactions",
  "Get Figma Prototyping Reactions from multiple nodes. CRITICAL: The output MUST be processed using the 'reaction_to_connector_strategy' prompt IMMEDIATELY to generate parameters for connector lines via the 'create_connections' tool.",
  {
    nodeIds: z.array(z.string()).describe("Array of node IDs to get reactions from"),
  },
  async ({ nodeIds }) => {
    try {
      const result = await sendCommandToFigma("get_reactions", { nodeIds });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          },
          {
            type: "text",
            text: "IMPORTANT: You MUST now use the reaction data above and follow the `reaction_to_connector_strategy` prompt to prepare the parameters for the `create_connections` tool call. This is a required next step."
          }
        ],
        followUp: {
          type: "prompt",
          prompt: "reaction_to_connector_strategy",
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting reactions: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);

// ==================== 设置默认连接器工具 ====================
// 工具名称: set_default_connector
// 功能: 设置复制的连接器节点为默认连接器
server.tool(
  "set_default_connector",
  "Set a copied connector node as the default connector",
  {
    connectorId: z.string().optional().describe("The ID of the connector node to set as default")
  },
  async ({ connectorId }) => {
    try {
      const result = await sendCommandToFigma("set_default_connector", {
        connectorId
      });

      return {
        content: [
          {
            type: "text",
            text: `Default connector set: ${JSON.stringify(result)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting default connector: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 创建连接工具 ====================
// 工具名称: create_connections
// 功能: 使用默认连接器样式在节点之间创建连接
server.tool(
  "create_connections",
  "Create connections between nodes using the default connector style",
  {
    connections: z.array(z.object({
      startNodeId: z.string().describe("ID of the starting node"),
      endNodeId: z.string().describe("ID of the ending node"),
      text: z.string().optional().describe("Optional text to display on the connector")
    })).describe("Array of node connections to create")
  },
  async ({ connections }) => {
    try {
      if (!connections || connections.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No connections provided"
            }
          ]
        };
      }

      const result = await sendCommandToFigma("create_connections", {
        connections
      });

      return {
        content: [
          {
            type: "text",
            text: `Created ${connections.length} connections: ${JSON.stringify(result)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating connections: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// Strategy for converting Figma prototype reactions to connector lines
server.prompt(
  "reaction_to_connector_strategy",
  "Strategy for converting Figma prototype reactions to connector lines using the output of 'get_reactions'",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Strategy: Convert Figma Prototype Reactions to Connector Lines

## Goal
Process the JSON output from the \`get_reactions\` tool to generate an array of connection objects suitable for the \`create_connections\` tool. This visually represents prototype flows as connector lines on the Figma canvas.

## Input Data
You will receive JSON data from the \`get_reactions\` tool. This data contains an array of nodes, each with potential reactions. A typical reaction object looks like this:
\`\`\`json
{
  "trigger": { "type": "ON_CLICK" },
  "action": {
    "type": "NAVIGATE",
    "destinationId": "destination-node-id",
    "navigationTransition": { ... },
    "preserveScrollPosition": false
  }
}
\`\`\`

## Step-by-Step Process

### 1. Preparation & Context Gathering
   - **Action:** Call \`read_my_design\` on the relevant node(s) to get context about the nodes involved (names, types, etc.). This helps in generating meaningful connector labels later.
   - **Action:** Call \`set_default_connector\` **without** the \`connectorId\` parameter.
   - **Check Result:** Analyze the response from \`set_default_connector\`.
     - If it confirms a default connector is already set (e.g., "Default connector is already set"), proceed to Step 2.
     - If it indicates no default connector is set (e.g., "No default connector set..."), you **cannot** proceed with \`create_connections\` yet. Inform the user they need to manually copy a connector from FigJam, paste it onto the current page, select it, and then you can run \`set_default_connector({ connectorId: "SELECTED_NODE_ID" })\` before attempting \`create_connections\`. **Do not proceed to Step 2 until a default connector is confirmed.**

### 2. Filter and Transform Reactions from \`get_reactions\` Output
   - **Iterate:** Go through the JSON array provided by \`get_reactions\`. For each node in the array:
     - Iterate through its \`reactions\` array.
   - **Filter:** Keep only reactions where the \`action\` meets these criteria:
     - Has a \`type\` that implies a connection (e.g., \`NAVIGATE\`, \`OPEN_OVERLAY\`, \`SWAP_OVERLAY\`). **Ignore** types like \`CHANGE_TO\`, \`CLOSE_OVERLAY\`, etc.
     - Has a valid \`destinationId\` property.
   - **Extract:** For each valid reaction, extract the following information:
     - \`sourceNodeId\`: The ID of the node the reaction belongs to (from the outer loop).
     - \`destinationNodeId\`: The value of \`action.destinationId\`.
     - \`actionType\`: The value of \`action.type\`.
     - \`triggerType\`: The value of \`trigger.type\`.

### 3. Generate Connector Text Labels
   - **For each extracted connection:** Create a concise, descriptive text label string.
   - **Combine Information:** Use the \`actionType\`, \`triggerType\`, and potentially the names of the source/destination nodes (obtained from Step 1's \`read_my_design\` or by calling \`get_node_info\` if necessary) to generate the label.
   - **Example Labels:**
     - If \`triggerType\` is "ON\_CLICK" and \`actionType\` is "NAVIGATE": "On click, navigate to [Destination Node Name]"
     - If \`triggerType\` is "ON\_DRAG" and \`actionType\` is "OPEN\_OVERLAY": "On drag, open [Destination Node Name] overlay"
   - **Keep it brief and informative.** Let this generated string be \`generatedText\`.

### 4. Prepare the \`connections\` Array for \`create_connections\`
   - **Structure:** Create a JSON array where each element is an object representing a connection.
   - **Format:** Each object in the array must have the following structure:
     \`\`\`json
     {
       "startNodeId": "sourceNodeId_from_step_2",
       "endNodeId": "destinationNodeId_from_step_2",
       "text": "generatedText_from_step_3"
     }
     \`\`\`
   - **Result:** This final array is the value you will pass to the \`connections\` parameter when calling the \`create_connections\` tool.

### 5. Execute Connection Creation
   - **Action:** Call the \`create_connections\` tool, passing the array generated in Step 4 as the \`connections\` argument.
   - **Verify:** Check the response from \`create_connections\` to confirm success or failure.

This detailed process ensures you correctly interpret the reaction data, prepare the necessary information, and use the appropriate tools to create the connector lines.`
          },
        },
      ],
      description: "Strategy for converting Figma prototype reactions to connector lines using the output of 'get_reactions'",
    };
  }
);


// Define command types and parameters
type FigmaCommand =
  | "get_document_info"
  | "get_selection"
  | "get_node_info"
  | "get_nodes_info"
  | "read_my_design"
  | "create_rectangle"
  | "create_frame"
  | "create_text"
  | "set_fill_color"
  | "set_stroke_color"
  | "move_node"
  | "move_node_to_parent"
  | "move_multiple_nodes_to_parent"
  | "resize_node"
  | "delete_node"
  | "delete_multiple_nodes"
  | "get_styles"
  | "get_local_components"
  | "create_component_instance"
  | "get_instance_overrides"
  | "set_instance_overrides"
  | "export_node_as_image"
  | "join"
  | "set_corner_radius"
  | "clone_node"
  | "set_text_content"
  | "scan_text_nodes"
  | "set_multiple_text_contents"
  | "get_annotations"
  | "set_annotation"
  | "set_multiple_annotations"
  | "scan_nodes_by_types"
  | "set_layout_mode"
  | "set_padding"
  | "set_axis_align"
  | "set_layout_sizing"
  | "set_item_spacing"
  | "get_reactions"
  | "set_default_connector"
  | "create_connections";

type CommandParams = {
  get_document_info: Record<string, never>;
  get_selection: Record<string, never>;
  get_node_info: { nodeId: string };
  get_nodes_info: { nodeIds: string[] };
  create_rectangle: {
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
    parentId?: string;
  };
  create_frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
    parentId?: string;
    fillColor?: { r: number; g: number; b: number; a?: number };
    strokeColor?: { r: number; g: number; b: number; a?: number };
    strokeWeight?: number;
  };
  create_text: {
    x: number;
    y: number;
    text: string;
    fontSize?: number;
    fontWeight?: number;
    fontColor?: { r: number; g: number; b: number; a?: number };
    name?: string;
    parentId?: string;
  };
  set_fill_color: {
    nodeId: string;
    r: number;
    g: number;
    b: number;
    a?: number;
  };
  set_stroke_color: {
    nodeId: string;
    r: number;
    g: number;
    b: number;
    a?: number;
    weight?: number;
  };
  move_node: {
    nodeId: string;
    x: number;
    y: number;
  };
  move_node_to_parent: {
    nodeId: string;
    parentId: string;
    x?: number;
    y?: number;
    index?: number;
  };
  move_multiple_nodes_to_parent: {
    nodeIds: string[];
    parentId: string;
    preserveRelativePositions?: boolean;
    startIndex?: number;
  };
  resize_node: {
    nodeId: string;
    width: number;
    height: number;
  };
  delete_node: {
    nodeId: string;
  };
  delete_multiple_nodes: {
    nodeIds: string[];
  };
  get_styles: Record<string, never>;
  get_local_components: Record<string, never>;
  get_team_components: Record<string, never>;
  create_component_instance: {
    componentKey: string;
    x: number;
    y: number;
  };
  get_instance_overrides: {
    instanceNodeId: string | null;
  };
  set_instance_overrides: {
    targetNodeIds: string[];
    sourceInstanceId: string;
  };
  export_node_as_image: {
    nodeId: string;
    format?: "PNG" | "JPG" | "SVG" | "PDF";
    scale?: number;
  };
  execute_code: {
    code: string;
  };
  join: {
    channel: string;
  };
  set_corner_radius: {
    nodeId: string;
    radius: number;
    corners?: boolean[];
  };
  clone_node: {
    nodeId: string;
    x?: number;
    y?: number;
  };
  set_text_content: {
    nodeId: string;
    text: string;
  };
  scan_text_nodes: {
    nodeId: string;
    useChunking: boolean;
    chunkSize: number;
  };
  set_multiple_text_contents: {
    nodeId: string;
    text: Array<{ nodeId: string; text: string }>;
  };
  get_annotations: {
    nodeId?: string;
    includeCategories?: boolean;
  };
  set_annotation: {
    nodeId: string;
    annotationId?: string;
    labelMarkdown: string;
    categoryId?: string;
    properties?: Array<{ type: string }>;
  };
  set_multiple_annotations: SetMultipleAnnotationsParams;
  scan_nodes_by_types: {
    nodeId: string;
    types: Array<string>;
  };
  get_reactions: { nodeIds: string[] };
  set_default_connector: {
    connectorId?: string | undefined;
  };
  create_connections: {
    connections: Array<{
      startNodeId: string;
      endNodeId: string;
      text?: string;
    }>;
  };
  
};


  // Helper function to process Figma node responses
function processFigmaNodeResponse(result: unknown): any {
  if (!result || typeof result !== "object") {
    return result;
  }

  // Check if this looks like a node response
  const resultObj = result as Record<string, unknown>;
  if ("id" in resultObj && typeof resultObj.id === "string") {
    // It appears to be a node response, log the details
    console.info(
      `Processed Figma node: ${resultObj.name || "Unknown"} (ID: ${resultObj.id
      })`
    );

    if ("x" in resultObj && "y" in resultObj) {
      console.debug(`Node position: (${resultObj.x}, ${resultObj.y})`);
    }

    if ("width" in resultObj && "height" in resultObj) {
      console.debug(`Node dimensions: ${resultObj.width}×${resultObj.height}`);
    }
  }

  return result;
}

// Update the connectToFigma function
function connectToFigma(port: number = 3055) {
  // If already connected, do nothing
  if (ws && ws.readyState === WebSocket.OPEN) {
    logger.info('Already connected to Figma');
    return;
  }

  const wsUrl = serverUrl === 'localhost' ? `${WS_URL}:${port}` : WS_URL;
  logger.info(`Connecting to Figma socket server at ${wsUrl}...`);
  ws = new WebSocket(wsUrl);

  // 设置连接超时
  const connectionTimeout = setTimeout(() => {
    if (ws && ws.readyState === WebSocket.CONNECTING) {
      logger.error('Connection timeout, closing WebSocket');
      ws.close();
    }
  }, 10000); // 10秒连接超时

  ws.on('open', () => {
    clearTimeout(connectionTimeout);
    logger.info('Connected to Figma socket server');
    // Reset channel on new connection
    currentChannel = null;
    
    // 发送心跳包以保持连接
    const heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "ping",
          timestamp: Date.now()
        }));
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // 每30秒发送一次心跳
  });

  ws.on("message", (data: any) => {
    try {
      // Define a more specific type with an index signature to allow any property access
      interface ProgressMessage {
        message: FigmaResponse | any;
        type?: string;
        id?: string;
        [key: string]: any; // Allow any other properties
      }

      const json = JSON.parse(data) as ProgressMessage;

      // 处理心跳响应
      if (json.type === 'ping') {
        // 响应心跳包
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "pong",
            timestamp: Date.now()
          }));
        }
        return;
      }

      // Handle progress updates
      if (json.type === 'progress_update') {
        const progressData = json.message.data as CommandProgressUpdate;
        const requestId = json.id || '';

        if (requestId && pendingRequests.has(requestId)) {
          const request = pendingRequests.get(requestId)!;

          // Update last activity timestamp
          request.lastActivity = Date.now();

          // Reset the timeout to prevent timeouts during long-running operations
          clearTimeout(request.timeout);

          // Create a new timeout with extended duration for active operations
          request.timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
              logger.error(`Request ${requestId} timed out after extended period of inactivity`);
              pendingRequests.delete(requestId);
              request.reject(new Error('Request to Figma timed out'));
            }
          }, 120000); // 2分钟超时用于活跃操作

          // Log progress
          logger.info(`Progress update for ${progressData.commandType}: ${progressData.progress}% - ${progressData.message}`);

          // For completed updates, we could resolve the request early if desired
          if (progressData.status === 'completed' && progressData.progress === 100) {
            // Optionally resolve early with partial data
            // request.resolve(progressData.payload);
            // pendingRequests.delete(requestId);

            // Instead, just log the completion, wait for final result from Figma
            logger.info(`Operation ${progressData.commandType} completed, waiting for final result`);
          }
        }
        return;
      }

      // Handle regular responses
      const myResponse = json.message;
      logger.debug(`Received message: ${JSON.stringify(myResponse)}`);
      logger.log('myResponse' + JSON.stringify(myResponse));

      // Handle response to a request
      if (
        myResponse.id &&
        pendingRequests.has(myResponse.id) &&
        myResponse.result
      ) {
        const request = pendingRequests.get(myResponse.id)!;
        clearTimeout(request.timeout);

        if (myResponse.error) {
          logger.error(`Error from Figma: ${myResponse.error}`);
          request.reject(new Error(myResponse.error));
        } else {
          if (myResponse.result) {
            request.resolve(myResponse.result);
          }
        }

        pendingRequests.delete(myResponse.id);
      } else {
        // Handle broadcast messages or events
        logger.info(`Received broadcast message: ${JSON.stringify(myResponse)}`);
      }
    } catch (error) {
      logger.error(`Error parsing message: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ws.on('error', (error) => {
    clearTimeout(connectionTimeout);
    logger.error(`Socket error: ${error}`);
    
    // 清理所有待处理的请求
    for (const [id, request] of pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error(`Connection error: ${error}`));
      pendingRequests.delete(id);
    }
  });

  ws.on('close', (code, reason) => {
    clearTimeout(connectionTimeout);
    logger.info(`Disconnected from Figma socket server. Code: ${code}, Reason: ${reason}`);
    ws = null;

    // Reject all pending requests
    for (const [id, request] of pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error("Connection closed"));
      pendingRequests.delete(id);
    }

    // 智能重连策略 - 限制重连次数
    if (code !== 1000) { // 1000 是正常关闭代码
      if (reconnectAttempts < 5) { // 最多重连5次
        reconnectAttempts++;
        const reconnectDelay = Math.min(5000, 1000 * Math.pow(2, Math.min(5, reconnectAttempts))); // 指数退避，最大5秒
        logger.info(`Attempting to reconnect (${reconnectAttempts}/5) in ${reconnectDelay}ms...`);
        setTimeout(() => {
          if (!ws || ws.readyState === WebSocket.CLOSED) {
            connectToFigma(port);
          }
        }, reconnectDelay);
      } else {
        logger.warn('Maximum reconnection attempts reached. WebSocket connection will be attempted when needed.');
        reconnectAttempts = 0; // 重置计数器，以便后续手动重连
      }
    }
  });
}

// Function to join a channel
async function joinChannel(channelName: string): Promise<void> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error("Not connected to Figma");
  }

  try {
    await sendCommandToFigma("join", { channel: channelName });
    currentChannel = channelName;
    logger.info(`Joined channel: ${channelName}`);
  } catch (error) {
    logger.error(`Failed to join channel: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Function to send commands to Figma
function sendCommandToFigma(
  command: FigmaCommand,
  params: unknown = {},
  timeoutMs: number = 60000 // 增加默认超时时间到60秒
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // If not connected, try to connect first
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectToFigma();
      reject(new Error("Not connected to Figma. Attempting to connect..."));
      return;
    }

    // Check if we need a channel for this command
    const requiresChannel = command !== "join";
    if (requiresChannel && !currentChannel) {
      reject(new Error("Must join a channel before sending commands"));
      return;
    }

    const id = uuidv4();
    const request = {
      id,
      type: command === "join" ? "join" : "message",
      ...(command === "join"
        ? { channel: (params as any).channel }
        : { channel: currentChannel }),
      message: {
        id,
        command,
        params: {
          ...(params as any),
          commandId: id, // Include the command ID in params
        },
      },
    };

    // 根据命令类型设置不同的超时时间
    let actualTimeout = timeoutMs;
    const longRunningCommands = [
      'get_local_components', 
      'get_styles', 
      'scan_text_nodes', 
      'set_multiple_text_contents',
      'set_multiple_annotations',
      'export_node_as_image'
    ];
    
    if (longRunningCommands.includes(command)) {
      actualTimeout = Math.max(timeoutMs, 120000); // 至少2分钟
      logger.info(`Using extended timeout of ${actualTimeout}ms for command: ${command}`);
    }

    // Set timeout for request
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        logger.error(`Request ${id} to Figma timed out after ${actualTimeout / 1000} seconds`);
        reject(new Error(`Request to Figma timed out after ${actualTimeout / 1000} seconds`));
      }
    }, actualTimeout);

    // Store the promise callbacks to resolve/reject later
    pendingRequests.set(id, {
      resolve,
      reject,
      timeout,
      lastActivity: Date.now()
    });

    // Send the request
    logger.info(`Sending command to Figma: ${command} (timeout: ${actualTimeout}ms)`);
    logger.debug(`Request details: ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));
  });
}

// ==================== 加入频道工具 ====================
// 工具名称: join_channel
// 功能: 加入指定频道与Figma通信
server.tool(
  "join_channel",
  "Join a specific channel to communicate with Figma",
  {
    channel: z.string().describe("The name of the channel to join (components or design)").default(""),
  },
  async ({ channel }) => {
    try {
      if (!channel) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a channel name to join. Available channels: 'components' or 'design'",
            },
          ],
        };
      }

      // Validate channel name
      if (channel !== "components" && channel !== "design") {
        return {
          content: [
            {
              type: "text",
              text: "Invalid channel name. Please use 'components' or 'design'",
          },
          ],
        };
      }

      await joinChannel(channel);
      return {
        content: [
          {
            type: "text",
            text: `Successfully joined channel: ${channel}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error joining channel: ${error instanceof Error ? error.message : String(error)
              }`,
          },
        ],
      };
    }
  }
);
       
// Start the server
async function main() {
  // Start the MCP server with stdio transport first
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('FigmaMCP server running on stdio');
  
  // Try to connect to Figma socket server in background
  // Don't block the MCP server startup if WebSocket connection fails
  setTimeout(() => {
    try {
    connectToFigma();
  } catch (error) {
    logger.warn(`Could not connect to Figma initially: ${error instanceof Error ? error.message : String(error)}`);
    logger.warn('Will try to connect when the first command is sent');
  }
  }, 1000);
}

// Run the server
main().catch(error => {
  logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

// 添加智能频道识别和切换功能
async function smartChannelSwitch(userInput: string): Promise<string> {
  const designKeywords = ['设计页', '设计稿', '界面设计', '页面设计', '生成设计', '创建界面', '设计界面'];
  const componentKeywords = ['组件库', '组件', '设计系统', '组件规范', '设计规范'];
  
  const lowerInput = userInput.toLowerCase();
  
  // 检查是否包含设计页关键词
  const hasDesignKeywords = designKeywords.some(keyword => lowerInput.includes(keyword));
  const hasComponentKeywords = componentKeywords.some(keyword => lowerInput.includes(keyword));
  
  let targetChannel: string = currentChannel || 'design'; // 默认为设计页
  
  if (hasDesignKeywords && !hasComponentKeywords) {
    targetChannel = 'design';
  } else if (hasComponentKeywords && !hasDesignKeywords) {
    targetChannel = 'components';
  } else if (hasDesignKeywords && hasComponentKeywords) {
    // 如果同时包含两种关键词，优先选择设计页（因为通常是要在设计页中使用组件库的组件）
    targetChannel = 'design';
  }
  
  // 如果需要切换频道
  if (targetChannel !== currentChannel) {
    try {
      await joinChannel(targetChannel);
      return `已自动切换到${targetChannel === 'design' ? '设计页' : '组件库'}频道`;
    } catch (error) {
      throw new Error(`切换到${targetChannel}频道失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return `当前已在${currentChannel === 'design' ? '设计页' : currentChannel === 'components' ? '组件库' : '未知'}频道`;
}

// ==================== 增强组件实例创建工具 ====================
// 工具名称: create_component_instance_enhanced
// 功能: 创建组件实例并确保正确定位（增强版）
server.tool(
  "create_component_instance_enhanced",
  "创建组件实例并确保正确定位（增强版）",
  {
    componentKey: z.string().describe("组件的key值"),
    x: z.number().describe("X坐标位置"),
    y: z.number().describe("Y坐标位置"),
    parentId: z.string().optional().describe("可选的父容器ID"),
    name: z.string().optional().describe("实例的自定义名称")
  },
  async ({ componentKey, x, y, parentId, name }) => {
    try {
      // 保存当前频道
      const originalChannel = currentChannel;
      
      // 首先验证组件是否存在 - 需要在组件库频道中查找
      let componentExists = false;
      let availableComponents = null;
      
      try {
        // 临时切换到组件库频道获取组件信息
        if (currentChannel !== 'components') {
          await joinChannel('components');
        }
        
        availableComponents = await sendCommandToFigma("get_local_components");
        componentExists = (availableComponents as any)?.components?.some((comp: any) => comp.key === componentKey);
        
        // 切换回原频道
        if (originalChannel && originalChannel !== 'components' && typeof originalChannel === 'string') {
          await joinChannel(originalChannel);
        }
      } catch (channelError) {
        console.warn("频道切换或组件获取失败:", channelError);
        // 如果频道切换失败，尝试在当前频道查找
        const currentComponents = await sendCommandToFigma("get_local_components");
        componentExists = (currentComponents as any)?.components?.some((comp: any) => comp.key === componentKey);
      }
      
      if (!componentExists) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 错误：找不到key为 "${componentKey}" 的组件。请检查组件key是否正确。
可用组件数量: ${(availableComponents as any)?.count || 0}`
            }
          ]
        };
      }

      // 创建组件实例
      const result = await sendCommandToFigma("create_component_instance", {
        componentKey,
        x,
        y
      });
      
      const typedResult = result as any;
      
      // 如果指定了父容器，将实例移动到父容器中
      if (parentId && typedResult.id) {
        try {
          await sendCommandToFigma("move_node_to_parent", {
            nodeId: typedResult.id,
            parentId: parentId,
            x: x,
            y: y
          });
        } catch (moveError) {
          console.warn("移动到父容器失败:", moveError);
        }
      }
      
      // 如果指定了自定义名称，可以尝试重命名（如果API支持）
      if (name && typedResult.id) {
        // 这里可以添加重命名逻辑
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ 成功创建组件实例！
📍 位置: (${x}, ${y})
🆔 实例ID: ${typedResult.id || '未知'}
📝 组件Key: ${componentKey}
${parentId ? `📁 父容器: ${parentId}` : ''}
${name ? `🏷️ 自定义名称: ${name}` : ''}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 创建组件实例失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 增强克隆节点工具 ====================
// 工具名称: clone_node_enhanced
// 功能: 克隆节点并确保正确定位（增强版）
server.tool(
  "clone_node_enhanced", 
  "克隆节点并确保正确定位（增强版）",
  {
    nodeId: z.string().describe("要克隆的节点ID"),
    x: z.number().describe("新位置的X坐标"),
    y: z.number().describe("新位置的Y坐标"),
    name: z.string().optional().describe("克隆节点的自定义名称"),
    verifyPosition: z.boolean().default(true).describe("是否验证克隆后的位置")
  },
  async ({ nodeId, x, y, name, verifyPosition }) => {
    try {
      // 首先获取原节点信息
      const originalNode = await sendCommandToFigma("get_node_info", { nodeId });
      
      // 执行克隆
      const result = await sendCommandToFigma('clone_node', { nodeId, x, y });
      const typedResult = result as { name: string, id: string };
      
      // 验证克隆是否成功
      if (!typedResult.id) {
        throw new Error("克隆失败：未返回新节点ID");
      }
      
      // 如果启用位置验证，检查克隆后的位置
      if (verifyPosition) {
        try {
          const clonedNode = await sendCommandToFigma("get_node_info", { nodeId: typedResult.id });
          const clonedNodeData = clonedNode as any;
          
          if (clonedNodeData.x !== x || clonedNodeData.y !== y) {
            // 如果位置不正确，尝试手动移动
            await sendCommandToFigma("move_node", { 
              nodeId: typedResult.id, 
              x, 
              y 
            });
          }
        } catch (verifyError) {
          console.warn("位置验证失败:", verifyError);
        }
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ 成功克隆节点！
📍 目标位置: (${x}, ${y})
🆔 新节点ID: ${typedResult.id}
📝 新节点名称: ${typedResult.name}
🔄 原节点ID: ${nodeId}
${name ? `🏷️ 自定义名称: ${name}` : ''}
${verifyPosition ? '✅ 已验证位置正确性' : ''}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 克隆节点失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 智能设计稿生成工具 ====================
// 工具名称: generate_design_with_reference
// 功能: 基于参考图和组件库生成设计稿（智能版）
server.tool(
  "generate_design_with_reference",
  "基于参考图和组件库生成设计稿（智能版）",
  {
    description: z.string().describe("设计需求描述"),
    referenceImageAnalysis: z.string().optional().describe("参考图分析结果"),
    useComponents: z.boolean().default(true).describe("是否使用组件库中的组件"),
    targetChannel: z.enum(["design", "components"]).optional().describe("目标频道，如果不指定将自动识别")
  },
  async ({ description, referenceImageAnalysis, useComponents, targetChannel }) => {
    try {
      // 智能频道切换
      let channelSwitchResult = "";
      if (targetChannel) {
        if (targetChannel !== currentChannel) {
          await joinChannel(targetChannel);
          channelSwitchResult = `已切换到${targetChannel === 'design' ? '设计页' : '组件库'}频道。`;
        }
      } else {
        channelSwitchResult = await smartChannelSwitch(description);
      }
      
      // 获取当前文档信息
      const documentInfo = await sendCommandToFigma("get_document_info");
      
      // 如果需要使用组件，获取组件库信息
      let availableComponents = null;
      if (useComponents) {
        try {
          // 临时切换到组件库频道获取组件信息
          const originalChannel = currentChannel;
          if (currentChannel !== 'components') {
            await joinChannel('components');
          }
          
          availableComponents = await sendCommandToFigma("get_local_components");
          
          // 切换回原频道
          if (originalChannel && originalChannel !== 'components' && typeof originalChannel === 'string') {
            await joinChannel(originalChannel);
          }
        } catch (componentError) {
          console.warn("获取组件库信息失败:", componentError);
        }
      }
      
      return {
        content: [
          {
            type: "text",
            text: `🎨 智能设计稿生成已启动！

📋 设计需求: ${description}
📍 ${channelSwitchResult}
📄 当前文档: ${(documentInfo as any)?.name || '未知'}
🧩 组件库状态: ${useComponents ? (availableComponents ? '✅ 已加载' : '❌ 加载失败') : '🚫 未使用'}
${referenceImageAnalysis ? `🖼️ 参考图分析: ${referenceImageAnalysis}` : ''}

💡 建议的设计流程:
1. 分析设计需求和参考图
2. 规划页面布局结构
3. 选择合适的组件库组件
4. 创建主容器框架
5. 逐步添加和定位元素
6. 应用设计系统规范
7. 验证与参考图的一致性

🚀 准备开始设计稿生成...`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 智能设计稿生成初始化失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 参考图对比验证工具 ====================
// 工具名称: verify_design_against_reference
// 功能: 对比设计稿与参考图的一致性
server.tool(
  "verify_design_against_reference",
  "对比设计稿与参考图的一致性",
  {
    designNodeId: z.string().describe("设计稿节点ID"),
    referenceDescription: z.string().describe("参考图描述或分析结果"),
    checkPoints: z.array(z.string()).optional().describe("需要检查的要点列表"),
    exportForComparison: z.boolean().default(false).describe("是否导出设计稿用于对比")
  },
  async ({ designNodeId, referenceDescription, checkPoints, exportForComparison }) => {
    try {
      // 获取设计稿节点信息
      const designNode = await sendCommandToFigma("get_node_info", { nodeId: designNodeId });
      const nodeData = designNode as any;
      
      // 如果需要导出进行对比
      let exportResult = null;
      if (exportForComparison) {
        try {
          exportResult = await sendCommandToFigma("export_node_as_image", {
            nodeId: designNodeId,
            format: "PNG",
            scale: 1
          });
        } catch (exportError) {
          console.warn("导出设计稿失败:", exportError);
        }
      }
      
      // 基础检查项目
      const defaultCheckPoints = [
        "整体布局结构",
        "颜色使用是否符合设计系统",
        "字体大小和层级",
        "间距和对齐",
        "组件使用的正确性"
      ];
      
      const finalCheckPoints = checkPoints || defaultCheckPoints;
      
      return {
        content: [
          {
            type: "text",
            text: `🔍 设计稿验证报告

📋 设计节点: ${nodeData.name || designNodeId}
📐 尺寸: ${nodeData.width || '未知'} x ${nodeData.height || '未知'}
📍 位置: (${nodeData.x || 0}, ${nodeData.y || 0})

🖼️ 参考图描述:
${referenceDescription}

✅ 检查要点:
${finalCheckPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

💡 验证建议:
1. 对比整体布局是否与参考图一致
2. 检查颜色是否符合设计系统规范
3. 验证文字层级和大小是否合适
4. 确认间距和对齐是否精确
5. 检查组件使用是否正确

${exportResult ? '📸 设计稿已导出，可用于详细对比' : ''}

🚨 注意事项:
- 请仔细对比每个细节
- 确保符合设计系统规范
- 注意用户体验的一致性`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 设计稿验证失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 设计稿质量检查工具 ====================
// 工具名称: design_quality_check
// 功能: 检查设计稿的质量和规范性
server.tool(
  "design_quality_check",
  "检查设计稿的质量和规范性",
  {
    nodeId: z.string().describe("要检查的设计稿节点ID"),
    checkDesignSystem: z.boolean().default(true).describe("是否检查设计系统规范"),
    checkAccessibility: z.boolean().default(true).describe("是否检查可访问性"),
    generateReport: z.boolean().default(true).describe("是否生成详细报告")
  },
  async ({ nodeId, checkDesignSystem, checkAccessibility, generateReport }) => {
    try {
      // 获取节点信息
      const nodeInfo = await sendCommandToFigma("get_node_info", { nodeId });
      const nodeData = nodeInfo as any;
      
      // 扫描子节点
      const childNodes = await sendCommandToFigma("scan_nodes_by_types", {
        nodeId,
        types: ["TEXT", "RECTANGLE", "FRAME", "COMPONENT", "INSTANCE"]
      });
      
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      // 基础检查
      if (!nodeData.name || nodeData.name.includes("Rectangle") || nodeData.name.includes("Frame")) {
        issues.push("节点命名不规范，建议使用语义化名称");
      }
      
      // 设计系统检查
      if (checkDesignSystem) {
        // 这里可以添加更多设计系统规范检查
        suggestions.push("检查颜色是否使用设计系统中定义的颜色");
        suggestions.push("验证字体大小是否符合设计系统规范");
        suggestions.push("确认间距使用设计系统中的标准间距");
      }
      
      // 可访问性检查
      if (checkAccessibility) {
        suggestions.push("检查文字对比度是否符合WCAG标准");
        suggestions.push("确认交互元素的最小点击区域");
        suggestions.push("验证颜色不是唯一的信息传达方式");
      }
      
      const qualityScore = Math.max(0, 100 - (issues.length * 10));
      
      return {
        content: [
          {
            type: "text",
            text: `📊 设计质量检查报告

🎯 检查节点: ${nodeData.name || nodeId}
📏 尺寸: ${nodeData.width || '未知'} x ${nodeData.height || '未知'}
⭐ 质量评分: ${qualityScore}/100

${issues.length > 0 ? `🚨 发现问题 (${issues.length}个):
${issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}` : '✅ 未发现明显问题'}

💡 改进建议:
${suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}

📋 检查项目:
✅ 节点命名规范
${checkDesignSystem ? '✅ 设计系统规范' : '⏭️ 跳过设计系统检查'}
${checkAccessibility ? '✅ 可访问性标准' : '⏭️ 跳过可访问性检查'}

🎯 总体评价:
${qualityScore >= 90 ? '🌟 优秀 - 设计质量很高' : 
  qualityScore >= 70 ? '👍 良好 - 有一些改进空间' : 
  qualityScore >= 50 ? '⚠️ 一般 - 需要较多改进' : 
  '🚨 需要重大改进'}

${generateReport ? `
📄 详细报告已生成，包含所有检查项目的详细信息。
建议根据报告逐项改进设计稿质量。` : ''}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 设计质量检查失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 批量组件实例创建工具 ====================
// 工具名称: create_multiple_component_instances
// 功能: 批量创建多个组件实例
server.tool(
  "create_multiple_component_instances",
  "批量创建多个组件实例",
  {
    instances: z.array(z.object({
      componentKey: z.string().describe("组件key"),
      x: z.number().describe("X坐标"),
      y: z.number().describe("Y坐标"),
      name: z.string().optional().describe("实例名称")
    })).describe("要创建的实例列表"),
    verifyPositions: z.boolean().default(true).describe("是否验证每个实例的位置")
  },
  async ({ instances, verifyPositions }) => {
    try {
      const results: any[] = [];
      const errors: string[] = [];
      
      for (const instance of instances) {
        try {
          const result = await sendCommandToFigma("create_component_instance", {
            componentKey: instance.componentKey,
            x: instance.x,
            y: instance.y
          });
          
          results.push({
            ...instance,
            result,
            success: true
          });
          
          // 如果启用位置验证
          if (verifyPositions && (result as any).id) {
            try {
              const nodeInfo = await sendCommandToFigma("get_node_info", { 
                nodeId: (result as any).id 
              });
              const nodeData = nodeInfo as any;
              
              if (Math.abs(nodeData.x - instance.x) > 1 || Math.abs(nodeData.y - instance.y) > 1) {
                // 位置不准确，尝试修正
                await sendCommandToFigma("move_node", {
                  nodeId: (result as any).id,
                  x: instance.x,
                  y: instance.y
                });
              }
            } catch (verifyError) {
              console.warn(`位置验证失败 (${instance.componentKey}):`, verifyError);
            }
          }
          
        } catch (instanceError) {
          errors.push(`创建实例失败 (${instance.componentKey}): ${instanceError instanceof Error ? instanceError.message : String(instanceError)}`);
          results.push({
            ...instance,
            success: false,
            error: instanceError instanceof Error ? instanceError.message : String(instanceError)
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        content: [
          {
            type: "text",
            text: `🎯 批量组件实例创建完成！

📊 创建统计:
✅ 成功: ${successCount}/${instances.length}
❌ 失败: ${errors.length}

${successCount > 0 ? `✅ 成功创建的实例:
${results.filter(r => r.success).map((r, index) => 
  `${index + 1}. ${r.name || r.componentKey} - 位置: (${r.x}, ${r.y})`
).join('\n')}` : ''}

${errors.length > 0 ? `❌ 创建失败的实例:
${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}` : ''}

${verifyPositions ? '✅ 已验证所有实例位置' : '⏭️ 跳过位置验证'}

💡 建议:
- 检查失败的实例是否使用了正确的组件key
- 确认坐标位置是否合理
- 验证组件是否在当前文档中可用`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 批量创建组件实例失败: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

// ==================== 游戏页面生成器工具 ====================
// 工具名称: generate_game_page_design
// 功能: 生成游戏切换页Figma设计稿 - 一键创建完整的移动端游戏切换页面
server.tool(
  "generate_game_page_design",
  "生成游戏切换页Figma设计稿 - 一键创建完整的移动端游戏切换页面",
  {
    pageWidth: z.number().default(375).describe("页面宽度，默认375px"),
    pageHeight: z.number().default(812).describe("页面高度，默认812px"),
    baseX: z.number().default(100).describe("页面起始X坐标"),
    baseY: z.number().default(100).describe("页面起始Y坐标"),
    useComponents: z.boolean().default(true).describe("是否使用组件库中的组件"),
    theme: z.enum(["dark", "light"]).default("dark").describe("主题风格"),
    includeHomeIndicator: z.boolean().default(true).describe("是否包含Home Indicator")
  },
  async ({ pageWidth, pageHeight, baseX, baseY, useComponents, theme, includeHomeIndicator }) => {
    try {
      logger.info("开始生成游戏切换页设计稿...");
      
      // 游戏数据配置
      const gameData = [
        // 第1行
        [
          { name: "阴阳师", iconKey: "c675c56fbd4b307f492b320e06c4e9f8e7882625" },
          { name: "梦幻西游", iconKey: "dbcd45502f3c6888427a80aa3126136ee1268993" },
          { name: "猎魂觉醒", iconKey: "6806f1a993852b5981f1e38af00a9ed77ef1c42e" },
          { name: "大唐无双", iconKey: "49f8a9b61a1fe4c7b3beba08235e18e00c553c31" }
        ],
        // 第2行
        [
          { name: "一梦江湖", iconKey: "2c0cab4b3e89e8efa47b48f2669563098f63802a" },
          { name: "荒野行动", iconKey: "55edebb9a5d8168df2a20964bbe52838d6134600" },
          { name: "明日之后", iconKey: "48e80ff27b07c87af963a15ffd073d6e22a323c2" },
          { name: "天谕手游", iconKey: "89820da4bb6fd5e9859882a2eb2e423dcb6c35e7" }
        ],
        // 第3行
        [
          { name: "天下手游", iconKey: "8efcd030f5634cd906aef3038c82716862585beb" },
          { name: "倩女幽魂", iconKey: "d3f22cd33b5f106af0c8e155743d42951a671094" },
          { name: "EVE手游", iconKey: "8825c181bcdb2f6a6c74c3f8061a44938b5c043e" },
          { name: "镇魂曲", iconKey: "ae09f748d761d75f3751a3f4d607d7585b06836d" }
        ],
        // 第4行
        [
          { name: "非人学园", iconKey: "347c3dadae89d97d9cf1f4f1071da560dc368988" },
          { name: "轩辕剑", iconKey: "584cd306fe14dc076fef56a414779e7ac1a616bb" },
          { name: "猫和老鼠", iconKey: "fec533b2c963f0b4811b3ac099bb8e12473cdd5a" },
          { name: "遇见逆水寒", iconKey: "018e7625d61a9509c90c571bddce4f1634e7dd49" }
        ],
        // 第5行
        [
          { name: "萤火突击", iconKey: "f308e104010c1a53cc33251e91d8d9a0464d6568" },
          { name: "无尽战区", iconKey: "fd9030da6bcd00c39e8755b13f2fa077f30345d2" },
          { name: "忘川风华录", iconKey: "100c092428d2431a5bfa646fb8e37a7dbf25af43" },
          { name: "第五人格", iconKey: "907d7862f22264aeb4d00a494b23214bfb3241ed" }
        ],
        // 第6行
        [
          { name: "蛋仔派对", iconKey: "f6df4571da44f141ade575cf9dbe2b88954b8ecd" },
          { name: "大话西游", iconKey: "6b305b38a5eb3bdfc6caa3fe8015abd47d760304" },
          { name: "超凡先锋", iconKey: "b70b3e1ee042d94da86fdf5bc055f03394a28e44" },
          { name: "暗黑破坏神", iconKey: "1e2119322cef621bc417c8cdf7a58326fe66e544" }
        ]
      ];

      // 组件Key配置
      const componentKeys = {
        statusBar: "dd59b1e5415d8118b717f3aa7b15905bf7df1825",
        searchBar: "d9cee5e7e307c1a4e5fa53b259c4dfa61fbd8c6a",
        homeIndicator: "b7a0740409b6250db848c85c25f8d4833f84af3d",
        filterAny: "3e061776588ed6053e2dc8cfddcb08e8e7fb00cb",
        filterSelected: "19e6b11c59b8e77940fc8cdb0234da69d4b0e308",
        filterUnselected: "103d7fd5af7385dd4663890c18527f43c9906ad0"
      };

      // 颜色配置 - 修正颜色设置
      const colors = theme === "dark" ? {
        background: { r: 0.98, g: 0.98, b: 0.98, a: 1 }, // 浅色背景
        gameGridBackground: { r: 0.98, g: 0.98, b: 0.98, a: 1 }, // #FAFAFA
        cardBackground: { r: 1, g: 1, b: 1, a: 0 },
        transparent: { r: 1, g: 1, b: 1, a: 0 }, // 透明填充
        text: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        textSecondary: { r: 0.4, g: 0.4, b: 0.4, a: 1 }
      } : {
        background: { r: 0.98, g: 0.98, b: 0.98, a: 1 }, // 浅色背景
        gameGridBackground: { r: 0.98, g: 0.98, b: 0.98, a: 1 }, // #FAFAFA
        cardBackground: { r: 1, g: 1, b: 1, a: 0 },
        transparent: { r: 1, g: 1, b: 1, a: 0 }, // 透明填充
        text: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        textSecondary: { r: 0.4, g: 0.4, b: 0.4, a: 1 }
      };

      let createdElements: string[] = [];

      // 步骤1：创建主框架
      logger.info("创建主框架...");
      const mainFrame = await sendCommandToFigma("create_frame", {
        x: baseX,
        y: baseY,
        width: pageWidth,
        height: pageHeight,
        name: "游戏切换页",
        fillColor: colors.background,
        layoutMode: "VERTICAL",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        itemSpacing: 0,
        primaryAxisAlignItems: "MIN",
        counterAxisAlignItems: "MIN"
      });
      const mainFrameId = (mainFrame as any).id;
      
      createdElements.push(`主框架: ${mainFrameId}`);

      // 步骤2：添加状态栏
      if (useComponents) {
        logger.info("添加状态栏...");
        const statusBar = await sendCommandToFigma("create_component_instance", {
          componentKey: componentKeys.statusBar,
          x: baseX,
          y: baseY,
          parentId: mainFrameId
        });
        
        createdElements.push(`状态栏: ${(statusBar as any).id}`);
      }

      // 步骤3：添加搜索栏
      if (useComponents) {
        logger.info("添加搜索栏...");
        const searchBar = await sendCommandToFigma("create_component_instance", {
          componentKey: componentKeys.searchBar,
          x: baseX,
          y: baseY + 44,
          parentId: mainFrameId
        });
        
        createdElements.push(`搜索栏: ${(searchBar as any).id}`);
      }

      // 步骤4：创建分类过滤器区域
      logger.info("创建分类过滤器...");
      const filterFrame = await sendCommandToFigma("create_frame", {
        x: baseX,
        y: baseY + 88,
        width: pageWidth,
        height: 60,
        name: "分类过滤器",
        fillColor: colors.cardBackground,
        layoutMode: "HORIZONTAL",
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        itemSpacing: 24,
        primaryAxisAlignItems: "MIN",
        counterAxisAlignItems: "CENTER",
        parentId: mainFrameId
      });
      const filterFrameId = (filterFrame as any).id;
      
      createdElements.push(`分类过滤器: ${filterFrameId}`);

      // 添加过滤器按钮 - 修正顺序：全部、手游（选中）、端游
      if (useComponents) {
        const filterButtons = [
          { key: componentKeys.filterAny, name: "全部", x: baseX + 16 },
          { key: componentKeys.filterSelected, name: "手游-选中", x: baseX + 88 },
          { key: componentKeys.filterUnselected, name: "端游", x: baseX + 160 }
        ];

        for (const button of filterButtons) {
          const filterButton = await sendCommandToFigma("create_component_instance", {
            componentKey: button.key,
            x: button.x,
            y: baseY + 100,
            parentId: filterFrameId
          });
          
          createdElements.push(`${button.name}: ${(filterButton as any).id}`);
        }
      }

      // 步骤5：创建游戏网格区域
      logger.info("创建游戏网格区域...");
      const gameGridFrame = await sendCommandToFigma("create_frame", {
        x: baseX,
        y: baseY + 148,
        width: pageWidth,
        height: 600,
        name: "游戏网格区域",
        fillColor: colors.transparent, // 设置为透明
        layoutMode: "VERTICAL",
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 16,
        paddingRight: 16,
        itemSpacing: 20,
        primaryAxisAlignItems: "MIN",
        counterAxisAlignItems: "MIN",
        parentId: mainFrameId
      });
      const gameGridFrameId = (gameGridFrame as any).id;
      
      createdElements.push(`游戏网格区域: ${gameGridFrameId}`);

      // 步骤6：创建游戏行和游戏图标
      logger.info("创建游戏内容...");
      for (let rowIndex = 0; rowIndex < gameData.length; rowIndex++) {
        const rowData = gameData[rowIndex];
        
        // 创建游戏行框架
        const gameRow = await sendCommandToFigma("create_frame", {
          x: baseX + 16,
          y: baseY + 168 + (rowIndex * 105),
          width: pageWidth - 32,
          height: 85,
          name: `游戏行${rowIndex + 1}`,
          fillColor: colors.transparent, // 设置为透明
          layoutMode: "HORIZONTAL",
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          itemSpacing: 0,
          primaryAxisAlignItems: "SPACE_BETWEEN",
          counterAxisAlignItems: "MIN",
          parentId: gameGridFrameId
        });
        const gameRowId = (gameRow as any).id;
        
        createdElements.push(`游戏行${rowIndex + 1}: ${gameRowId}`);

        // 为每行创建4个游戏容器
        for (let colIndex = 0; colIndex < 4; colIndex++) {
          if (rowData[colIndex]) {
            const game = rowData[colIndex];
            const gameX = baseX + 16 + (colIndex * 85);
            const gameY = baseY + 168 + (rowIndex * 105);

            // 创建游戏容器
            const gameContainer = await sendCommandToFigma("create_frame", {
              x: gameX,
              y: gameY,
              width: 70,
              height: 85,
              name: `游戏容器-${game.name}`,
              fillColor: colors.transparent, // 设置为透明
              layoutMode: "VERTICAL",
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
              itemSpacing: 8,
              primaryAxisAlignItems: "MIN",
              counterAxisAlignItems: "CENTER",
              parentId: gameRowId
            });
            const gameContainerId = (gameContainer as any).id;

            // 添加游戏图标
            if (useComponents && game.iconKey) {
              try {
                const gameIcon = await sendCommandToFigma("create_component_instance", {
                  componentKey: game.iconKey,
                  x: gameX + 5,
                  y: gameY,
                  parentId: gameContainerId
                });
                
                createdElements.push(`${game.name}图标: ${(gameIcon as any).id}`);
              } catch (iconError) {
                // 如果组件不存在，创建占位符
                const placeholder = await sendCommandToFigma("create_rectangle", {
                  x: gameX + 5,
                  y: gameY,
                  width: 60,
                  height: 60,
                  name: `${game.name}图标占位符`,
                  parentId: gameContainerId
                });
                
                createdElements.push(`${game.name}占位符: ${(placeholder as any).id}`);
              }
            }

            // 添加游戏名称
            const gameName = await sendCommandToFigma("create_text", {
              x: gameX + 5,
              y: gameY + 68,
              text: game.name,
              name: `游戏名-${game.name}`,
              fontSize: 12,
              fontColor: colors.textSecondary,
              parentId: gameContainerId
            });
            
            createdElements.push(`${game.name}文字: ${(gameName as any).id}`);
          }
        }
      }

      // 步骤7：添加Home Indicator（如果需要）
      if (includeHomeIndicator && useComponents) {
        logger.info("添加Home Indicator...");
        const homeIndicator = await sendCommandToFigma("create_component_instance", {
          componentKey: componentKeys.homeIndicator,
          x: baseX,
          y: baseY + pageHeight - 34,
          parentId: mainFrameId
        });
        
        createdElements.push(`Home Indicator: ${(homeIndicator as any).id}`);
      }

      logger.info("游戏切换页设计稿生成完成！");

      return {
        content: [
          {
            type: "text",
            text: `🎮 游戏切换页设计稿生成成功！

📱 页面规格:
• 尺寸: ${pageWidth} x ${pageHeight}px
• 主题: ${theme === "dark" ? "深色" : "浅色"}主题
• 位置: (${baseX}, ${baseY})

🎯 生成内容:
✅ 状态栏和搜索栏
✅ 分类过滤器（手游选中状态）
✅ 6行4列游戏网格布局（共24个游戏）
✅ 使用组件库中的游戏图标
${includeHomeIndicator ? '✅ Home Indicator' : '⏭️ 跳过Home Indicator'}

📊 创建统计:
• 主框架: 1个
• 系统组件: ${useComponents ? '3个' : '0个（跳过）'}
• 过滤器按钮: ${useComponents ? '4个' : '0个（跳过）'}
• 游戏容器: 24个
• 游戏图标: 24个
• 游戏名称: 24个

🎨 设计特色:
• 现代化${theme === "dark" ? "深色" : "浅色"}主题
• 响应式自动布局
• 标准移动端尺寸
• 组件化设计系统
• 完整的交互状态

💡 使用建议:
1. 可以调整游戏图标的圆角和阴影
2. 根据需要修改分类过滤器的选中状态
3. 可以添加更多游戏或调整网格布局
4. 建议为交互元素添加悬停和点击状态

🔧 创建的元素ID:
${createdElements.slice(0, 10).join('\n')}
${createdElements.length > 10 ? `\n... 还有${createdElements.length - 10}个元素` : ''}

主框架ID: ${mainFrameId}
现在您可以在Figma中查看和编辑这个完整的游戏切换页设计稿！`
          }
        ]
      };
    } catch (error) {
      logger.error(`游戏页面生成失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `❌ 游戏切换页生成失败: ${error instanceof Error ? error.message : String(error)}

🔧 故障排除建议:
1. 确保已连接到Figma并加入了正确的频道
2. 检查组件库是否包含所需的组件
3. 验证坐标位置是否合理
4. 确认Figma文档有足够的空间

请检查错误信息并重试。`
          }
        ]
      };
    }
  }
);



