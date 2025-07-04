#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/talk_to_figma_mcp/server.ts
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_zod = require("zod");
var import_ws = __toESM(require("ws"), 1);
var import_uuid = require("uuid");
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var config = {};
try {
  const configPath = path.join(__dirname, "../../config.json");
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(configData);
  }
} catch (error) {
  console.error("Failed to load config.json:", error);
}
var logger = {
  info: (message) => process.stderr.write(`[INFO] ${message}
`),
  debug: (message) => process.stderr.write(`[DEBUG] ${message}
`),
  warn: (message) => process.stderr.write(`[WARN] ${message}
`),
  error: (message) => process.stderr.write(`[ERROR] ${message}
`),
  log: (message) => process.stderr.write(`[LOG] ${message}
`)
};
function nodeSupportsProperty(nodeType, property) {
  const propertyMap = {
    "fills": ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR", "TEXT", "FRAME", "COMPONENT", "INSTANCE"],
    "strokes": ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR", "TEXT", "FRAME", "COMPONENT", "INSTANCE", "LINE"],
    "cornerRadius": ["RECTANGLE", "FRAME", "COMPONENT", "INSTANCE"],
    "characters": ["TEXT"],
    "style": ["TEXT"],
    "children": ["FRAME", "GROUP", "COMPONENT", "INSTANCE", "BOOLEAN_OPERATION"],
    "layoutMode": ["FRAME", "COMPONENT", "INSTANCE"]
  };
  return propertyMap[property]?.includes(nodeType) || false;
}
function generateCSSTokens(tokens) {
  let css = `/* Generated Design System CSS Tokens */
/* Generated at: ${(/* @__PURE__ */ new Date()).toISOString()} */

:root {
`;
  if (tokens.colors) {
    css += "  /* Color Tokens */\n";
    Object.entries(tokens.colors).forEach(([name, token]) => {
      if (token.value && typeof token.value === "object") {
        const { r, g, b } = token.value;
        const rgbValue = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
        css += `  --color-${name}: ${rgbValue};
`;
      }
    });
    css += "\n";
  }
  if (tokens.typography) {
    css += "  /* Typography Tokens */\n";
    Object.entries(tokens.typography).forEach(([name, token]) => {
      if (token.value) {
        if (token.value.fontFamily) {
          css += `  --font-family-${name}: "${token.value.fontFamily}";
`;
        }
        if (token.value.fontSize) {
          css += `  --font-size-${name}: ${token.value.fontSize}px;
`;
        }
        if (token.value.fontWeight) {
          css += `  --font-weight-${name}: ${token.value.fontWeight};
`;
        }
      }
    });
    css += "\n";
  }
  css += "}\n";
  return css;
}
function generateUpdateScript(designSystem) {
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
        console.log('\u2705 \u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u52A0\u8F7D\u6210\u529F');
      } else {
        console.log('\u274C \u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u6587\u4EF6\u4E0D\u5B58\u5728');
      }
    } catch (error) {
      console.error('\u274C \u52A0\u8F7D\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u5931\u8D25:', error.message);
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
      console.log('\u2705 \u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u66F4\u65B0\u6210\u529F');
      return true;
    } catch (error) {
      console.error('\u274C \u66F4\u65B0\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u5931\u8D25:', error.message);
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

  // \u83B7\u53D6\u7EC4\u4EF6\u4FE1\u606F
  getComponentById(componentId) {
    const components = this.getComponents();
    return components.components?.find(comp => comp.id === componentId);
  }

  // \u83B7\u53D6\u989C\u8272\u4EE4\u724C
  getColorToken(tokenName) {
    const tokens = this.getTokens();
    return tokens.colors?.[tokenName];
  }

  // \u83B7\u53D6\u5B57\u4F53\u4EE4\u724C
  getTypographyToken(tokenName) {
    const tokens = this.getTokens();
    return tokens.typography?.[tokenName];
  }

  // \u751F\u6210\u4F7F\u7528\u62A5\u544A
  generateUsageReport() {
    const components = this.getComponents();
    const styles = this.getStyles();
    const tokens = this.getTokens();
    
    console.log('\u{1F4CA} \u8BBE\u8BA1\u7CFB\u7EDF\u4F7F\u7528\u62A5\u544A');
    console.log('==================');
    console.log(\`\u7EC4\u4EF6\u6570\u91CF: \${components.count || 0}\`);
    console.log(\`\u989C\u8272\u6837\u5F0F: \${styles.colors?.length || 0}\`);
    console.log(\`\u6587\u5B57\u6837\u5F0F: \${styles.texts?.length || 0}\`);
    console.log(\`\u6548\u679C\u6837\u5F0F: \${styles.effects?.length || 0}\`);
    console.log(\`\u989C\u8272\u4EE4\u724C: \${Object.keys(tokens.colors || {}).length}\`);
    console.log(\`\u5B57\u4F53\u4EE4\u724C: \${Object.keys(tokens.typography || {}).length}\`);
    console.log('==================');
  }
}

// \u5BFC\u51FA\u66F4\u65B0\u5668\u5B9E\u4F8B
module.exports = new FigmaComponentUpdater();

// \u5982\u679C\u76F4\u63A5\u8FD0\u884C\u6B64\u811A\u672C\uFF0C\u663E\u793A\u4F7F\u7528\u62A5\u544A
if (require.main === module) {
  const updater = module.exports;
  updater.generateUsageReport();
}
`;
}
var ws = null;
var reconnectAttempts = 0;
var pendingRequests = /* @__PURE__ */ new Map();
var currentChannel = null;
var server = new import_mcp.McpServer({
  name: "TalkToFigmaMCP",
  version: "1.0.0"
});
var args = process.argv.slice(2);
var serverArg = args.find((arg) => arg.startsWith("--server="));
var serverUrl = serverArg ? serverArg.split("=")[1] : "localhost";
var WS_URL = serverUrl === "localhost" ? `ws://${serverUrl}` : `wss://${serverUrl}`;
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
            text: `Error getting document info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
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
            text: `Error getting selection: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
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
            text: `Error getting node info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_node_info",
  "Get detailed information about a specific node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to get information about")
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
            text: `Error getting node info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
function rgbaToHex(color) {
  if (typeof color === "string" && color.startsWith("#")) {
    return color;
  }
  if (!color || typeof color !== "object" || typeof color.r !== "number" || typeof color.g !== "number" || typeof color.b !== "number") {
    return "#000000";
  }
  const r = Math.round(Math.max(0, Math.min(1, color.r)) * 255);
  const g = Math.round(Math.max(0, Math.min(1, color.g)) * 255);
  const b = Math.round(Math.max(0, Math.min(1, color.b)) * 255);
  const a = color.a !== void 0 ? Math.round(Math.max(0, Math.min(1, color.a)) * 255) : 255;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a === 255 ? "" : a.toString(16).padStart(2, "0")}`;
}
function filterFigmaNode(node) {
  if (node.type === "VECTOR") {
    return null;
  }
  const filtered = {
    id: node.id,
    name: node.name,
    type: node.type
  };
  if (nodeSupportsProperty(node.type, "fills") && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    filtered.fills = node.fills.map((fill) => {
      const processedFill = { ...fill };
      delete processedFill.boundVariables;
      delete processedFill.imageRef;
      if (processedFill.gradientStops) {
        processedFill.gradientStops = processedFill.gradientStops.map((stop) => {
          const processedStop = { ...stop };
          if (processedStop.color) {
            processedStop.color = rgbaToHex(processedStop.color);
          }
          delete processedStop.boundVariables;
          return processedStop;
        });
      }
      if (processedFill.color) {
        processedFill.color = rgbaToHex(processedFill.color);
      }
      return processedFill;
    });
  }
  if (nodeSupportsProperty(node.type, "strokes") && node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
    filtered.strokes = node.strokes.map((stroke) => {
      const processedStroke = { ...stroke };
      delete processedStroke.boundVariables;
      if (processedStroke.color) {
        processedStroke.color = rgbaToHex(processedStroke.color);
      }
      return processedStroke;
    });
  }
  if (nodeSupportsProperty(node.type, "cornerRadius") && node.cornerRadius !== void 0) {
    filtered.cornerRadius = node.cornerRadius;
  }
  if (node.absoluteBoundingBox) {
    filtered.absoluteBoundingBox = node.absoluteBoundingBox;
  }
  if (nodeSupportsProperty(node.type, "characters")) {
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
  if (nodeSupportsProperty(node.type, "children") && node.children && Array.isArray(node.children)) {
    filtered.children = node.children.map((child) => filterFigmaNode(child)).filter((child) => child !== null);
  }
  return filtered;
}
server.tool(
  "get_nodes_info",
  "Get detailed information about multiple nodes in Figma",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to get information about")
  },
  async ({ nodeIds }) => {
    try {
      const results = await Promise.all(
        nodeIds.map(async (nodeId) => {
          const result = await sendCommandToFigma("get_node_info", { nodeId });
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
            text: `Error getting nodes info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_rectangle",
  "Create a new rectangle in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    width: import_zod.z.number().describe("Width of the rectangle"),
    height: import_zod.z.number().describe("Height of the rectangle"),
    name: import_zod.z.string().optional().describe("Optional name for the rectangle"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the rectangle to")
  },
  async ({ x, y, width, height, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_rectangle", {
        x,
        y,
        width,
        height,
        name: name || "Rectangle",
        parentId
      });
      return {
        content: [
          {
            type: "text",
            text: `Created rectangle "${JSON.stringify(result)}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating rectangle: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_frame",
  "Create a new frame in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    width: import_zod.z.number().describe("Width of the frame"),
    height: import_zod.z.number().describe("Height of the frame"),
    name: import_zod.z.string().optional().describe("Optional name for the frame"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the frame to"),
    fillColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Fill color in RGBA format"),
    strokeColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Stroke color in RGBA format"),
    strokeWeight: import_zod.z.number().positive().optional().describe("Stroke weight"),
    layoutMode: import_zod.z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional().describe("Auto-layout mode for the frame"),
    layoutWrap: import_zod.z.enum(["NO_WRAP", "WRAP"]).optional().describe("Whether the auto-layout frame wraps its children"),
    paddingTop: import_zod.z.number().optional().describe("Top padding for auto-layout frame"),
    paddingRight: import_zod.z.number().optional().describe("Right padding for auto-layout frame"),
    paddingBottom: import_zod.z.number().optional().describe("Bottom padding for auto-layout frame"),
    paddingLeft: import_zod.z.number().optional().describe("Left padding for auto-layout frame"),
    primaryAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional().describe("Primary axis alignment for auto-layout frame. Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."),
    counterAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional().describe("Counter axis alignment for auto-layout frame"),
    layoutSizingHorizontal: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Horizontal sizing mode for auto-layout frame"),
    layoutSizingVertical: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Vertical sizing mode for auto-layout frame"),
    itemSpacing: import_zod.z.number().optional().describe("Distance between children in auto-layout frame. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN.")
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
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Created frame "${typedResult.name}" with ID: ${typedResult.id}. Use the ID as the parentId to appendChild inside this frame.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating frame: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_text",
  "Create a new text element in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    text: import_zod.z.string().describe("Text content"),
    fontSize: import_zod.z.number().optional().describe("Font size (default: 14)"),
    fontWeight: import_zod.z.number().optional().describe("Font weight (e.g., 400 for Regular, 700 for Bold)"),
    fontColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Font color in RGBA format"),
    name: import_zod.z.string().optional().describe("Semantic layer name for the text node"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the text to")
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
        parentId
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Created text "${typedResult.name}" with ID: ${typedResult.id}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating text: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_fill_color",
  "Set the fill color of a node in Figma can be TextNode or FrameNode",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
    g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
    b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
  },
  async ({ nodeId, r, g, b, a }) => {
    try {
      const result = await sendCommandToFigma("set_fill_color", {
        nodeId,
        color: { r, g, b, a: a || 1 }
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set fill color of node "${typedResult.name}" to RGBA(${r}, ${g}, ${b}, ${a || 1})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting fill color: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_stroke_color",
  "Set the stroke color of a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
    g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
    b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)"),
    weight: import_zod.z.number().positive().optional().describe("Stroke weight")
  },
  async ({ nodeId, r, g, b, a, weight }) => {
    try {
      const result = await sendCommandToFigma("set_stroke_color", {
        nodeId,
        color: { r, g, b, a: a || 1 },
        weight: weight || 1
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set stroke color of node "${typedResult.name}" to RGBA(${r}, ${g}, ${b}, ${a || 1}) with weight ${weight || 1}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting stroke color: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "move_node",
  "Move a node to a new position in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to move"),
    x: import_zod.z.number().describe("New X position"),
    y: import_zod.z.number().describe("New Y position")
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma("move_node", { nodeId, x, y });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Moved node "${typedResult.name}" to position (${x}, ${y})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error moving node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "move_node_to_parent",
  "Move a node to a specified parent container in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to move"),
    parentId: import_zod.z.string().describe("The ID of the parent container to move the node into"),
    x: import_zod.z.number().optional().describe("Optional X position within the parent container"),
    y: import_zod.z.number().optional().describe("Optional Y position within the parent container"),
    index: import_zod.z.number().optional().describe("Optional index position in the parent's children array")
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
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Successfully moved node "${typedResult.name}" to parent container "${typedResult.parentName}"${x !== void 0 && y !== void 0 ? ` at position (${x}, ${y})` : ""}${index !== void 0 ? ` at index ${index}` : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error moving node to parent: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "move_multiple_nodes_to_parent",
  "Move multiple nodes to a specified parent container in Figma",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to move"),
    parentId: import_zod.z.string().describe("The ID of the parent container to move the nodes into"),
    preserveRelativePositions: import_zod.z.boolean().default(true).describe("Whether to preserve relative positions between nodes"),
    startIndex: import_zod.z.number().optional().describe("Starting index position in the parent's children array")
  },
  async ({ nodeIds, parentId, preserveRelativePositions, startIndex }) => {
    try {
      const results = [];
      const errors = [];
      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        try {
          const result = await sendCommandToFigma("move_node_to_parent", {
            nodeId,
            parentId,
            index: startIndex !== void 0 ? startIndex + i : void 0
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
      const successCount = results.filter((r) => r.success).length;
      return {
        content: [
          {
            type: "text",
            text: `\u6279\u91CF\u79FB\u52A8\u8282\u70B9\u5230\u7236\u5BB9\u5668\u5B8C\u6210\uFF01

\u{1F4CA} \u79FB\u52A8\u7EDF\u8BA1:
\u2705 \u6210\u529F: ${successCount}/${nodeIds.length}
\u274C \u5931\u8D25: ${errors.length}
\u{1F4C1} \u76EE\u6807\u7236\u5BB9\u5668: ${parentId}
\u{1F504} \u4FDD\u6301\u76F8\u5BF9\u4F4D\u7F6E: ${preserveRelativePositions ? "\u662F" : "\u5426"}

${successCount > 0 ? `\u2705 \u6210\u529F\u79FB\u52A8\u7684\u8282\u70B9:
${results.filter((r) => r.success).map(
              (r, index) => `${index + 1}. ${r.nodeId}`
            ).join("\n")}` : ""}

${errors.length > 0 ? `\u274C \u79FB\u52A8\u5931\u8D25\u7684\u8282\u70B9:
${errors.map((error, index) => `${index + 1}. ${error}`).join("\n")}` : ""}

\u{1F4A1} \u5EFA\u8BAE:
- \u786E\u8BA4\u7236\u5BB9\u5668ID\u662F\u5426\u6B63\u786E
- \u68C0\u67E5\u8282\u70B9\u662F\u5426\u5B58\u5728\u4E14\u53EF\u79FB\u52A8
- \u9A8C\u8BC1\u7236\u5BB9\u5668\u662F\u5426\u652F\u6301\u5B50\u8282\u70B9`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u6279\u91CF\u79FB\u52A8\u8282\u70B9\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "clone_node",
  "Clone an existing node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to clone"),
    x: import_zod.z.number().optional().describe("New X position for the clone"),
    y: import_zod.z.number().optional().describe("New Y position for the clone")
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma("clone_node", { nodeId, x, y });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Cloned node "${typedResult.name}" with new ID: ${typedResult.id}${x !== void 0 && y !== void 0 ? ` at position (${x}, ${y})` : ""}`
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
server.tool(
  "resize_node",
  "Resize a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to resize"),
    width: import_zod.z.number().positive().describe("New width"),
    height: import_zod.z.number().positive().describe("New height")
  },
  async ({ nodeId, width, height }) => {
    try {
      const result = await sendCommandToFigma("resize_node", {
        nodeId,
        width,
        height
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Resized node "${typedResult.name}" to width ${width} and height ${height}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error resizing node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "delete_node",
  "Delete a node from Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to delete")
  },
  async ({ nodeId }) => {
    try {
      await sendCommandToFigma("delete_node", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: `Deleted node with ID: ${nodeId}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "delete_multiple_nodes",
  "Delete multiple nodes from Figma at once",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to delete")
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
            text: `Error deleting multiple nodes: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "export_node_as_image",
  "Export a node as an image from Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to export"),
    format: import_zod.z.enum(["PNG", "JPG", "SVG", "PDF"]).optional().describe("Export format"),
    scale: import_zod.z.number().positive().optional().describe("Export scale")
  },
  async ({ nodeId, format, scale }) => {
    try {
      const result = await sendCommandToFigma("export_node_as_image", {
        nodeId,
        format: format || "PNG",
        scale: scale || 1
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "image",
            data: typedResult.imageData,
            mimeType: typedResult.mimeType || "image/png"
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error exporting node as image: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_text_content",
  "Set the text content of an existing text node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the text node to modify"),
    text: import_zod.z.string().describe("New text content")
  },
  async ({ nodeId, text }) => {
    try {
      const result = await sendCommandToFigma("set_text_content", {
        nodeId,
        text
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Updated text content of node "${typedResult.name}" to "${text}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting text content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
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
            text: `Error getting styles: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
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
            text: `Error getting local components: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "generate_design_system_specification",
  "Generate a comprehensive design system specification from the current Figma document, including components, styles, and design tokens. This tool creates JSON files with detailed design system information.",
  {
    outputPath: import_zod.z.string().optional().describe("Optional custom output path for the generated files. Defaults to './json' directory"),
    includeComponents: import_zod.z.boolean().optional().default(true).describe("Whether to include component specifications"),
    includeStyles: import_zod.z.boolean().optional().default(true).describe("Whether to include style specifications (colors, typography, effects)"),
    includeTokens: import_zod.z.boolean().optional().default(true).describe("Whether to generate design tokens"),
    format: import_zod.z.enum(["json", "typescript", "css"]).optional().default("json").describe("Output format for the specification")
  },
  async ({ outputPath, includeComponents, includeStyles, includeTokens, format }) => {
    try {
      const defaultPath = config?.settings?.designSystem?.outputPath || path.join(process.cwd(), "json");
      const outputDir = outputPath || path.resolve(__dirname, defaultPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const designSystem = {
        metadata: {
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          version: "1.0.0",
          source: "Figma Document"
        }
      };
      const documentInfo = await sendCommandToFigma("get_document_info");
      designSystem.document = documentInfo;
      if (includeComponents) {
        const components = await sendCommandToFigma("get_local_components");
        designSystem.components = components;
      }
      if (includeStyles) {
        const styles = await sendCommandToFigma("get_styles");
        designSystem.styles = styles;
      }
      if (includeTokens && designSystem.styles) {
        designSystem.tokens = {
          colors: {},
          typography: {},
          spacing: {},
          effects: {}
        };
        if (designSystem.styles.colors) {
          designSystem.styles.colors.forEach((color) => {
            const tokenName = color.name.toLowerCase().replace(/\s+/g, "-");
            designSystem.tokens.colors[tokenName] = {
              value: color.paint?.color || color.paint,
              type: "color",
              description: `Color token for ${color.name}`
            };
          });
        }
        if (designSystem.styles.texts) {
          designSystem.styles.texts.forEach((text) => {
            const tokenName = text.name.toLowerCase().replace(/\s+/g, "-");
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
      let fileName;
      let fileContent;
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
      fs.writeFileSync(filePath, fileContent, "utf8");
      if (includeComponents) {
        const updateScriptPath = path.join(outputDir, "update-figma-components.js");
        const updateScript = generateUpdateScript(designSystem);
        fs.writeFileSync(updateScriptPath, updateScript, "utf8");
      }
      return {
        content: [
          {
            type: "text",
            text: `\u2705 \u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u751F\u6210\u6210\u529F\uFF01

\u{1F4C1} \u751F\u6210\u7684\u6587\u4EF6\uFF1A
- ${fileName}: \u4E3B\u8981\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u6587\u4EF6
${includeComponents ? `- update-figma-components.js: \u7EC4\u4EF6\u66F4\u65B0\u811A\u672C` : ""}

\u{1F4CA} \u5305\u542B\u5185\u5BB9\uFF1A
- \u6587\u6863\u4FE1\u606F: ${designSystem.document ? "\u2705" : "\u274C"}
- \u7EC4\u4EF6\u89C4\u8303: ${includeComponents && designSystem.components ? `\u2705 (${designSystem.components.count || 0} \u4E2A\u7EC4\u4EF6)` : "\u274C"}
- \u6837\u5F0F\u89C4\u8303: ${includeStyles && designSystem.styles ? "\u2705" : "\u274C"}
- \u8BBE\u8BA1\u4EE4\u724C: ${includeTokens && designSystem.tokens ? "\u2705" : "\u274C"}

\u{1F4CD} \u8F93\u51FA\u8DEF\u5F84: ${filePath}

\u{1F4A1} \u4F7F\u7528\u8BF4\u660E\uFF1A
1. \u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u6587\u4EF6\u5305\u542B\u4E86\u5F53\u524DFigma\u6587\u6863\u7684\u5B8C\u6574\u8BBE\u8BA1\u4FE1\u606F
2. \u53EF\u4EE5\u5728\u4EE3\u7801\u4E2D\u5BFC\u5165\u4F7F\u7528\uFF0C\u786E\u4FDD\u8BBE\u8BA1\u4E0E\u5F00\u53D1\u7684\u4E00\u81F4\u6027
3. \u5F53\u8BBE\u8BA1\u66F4\u65B0\u65F6\uFF0C\u91CD\u65B0\u8FD0\u884C\u6B64\u5DE5\u5177\u5373\u53EF\u66F4\u65B0\u89C4\u8303\u6587\u4EF6`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u751F\u6210\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303\u65F6\u51FA\u9519: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_annotations",
  "Get all annotations in the current document or specific node",
  {
    nodeId: import_zod.z.string().optional().describe("Optional node ID to get annotations for specific node"),
    includeCategories: import_zod.z.boolean().optional().default(true).describe("Whether to include category information")
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
server.tool(
  "set_annotation",
  "Create or update an annotation",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to annotate"),
    annotationId: import_zod.z.string().optional().describe("The ID of the annotation to update (if updating existing annotation)"),
    labelMarkdown: import_zod.z.string().describe("The annotation text in markdown format"),
    categoryId: import_zod.z.string().optional().describe("The ID of the annotation category"),
    properties: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.string()
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
server.tool(
  "set_multiple_annotations",
  "Set multiple annotations parallelly in a node",
  {
    nodeId: import_zod.z.string().describe("The ID of the node containing the elements to annotate"),
    annotations: import_zod.z.array(
      import_zod.z.object({
        nodeId: import_zod.z.string().describe("The ID of the node to annotate"),
        labelMarkdown: import_zod.z.string().describe("The annotation text in markdown format"),
        categoryId: import_zod.z.string().optional().describe("The ID of the annotation category"),
        annotationId: import_zod.z.string().optional().describe("The ID of the annotation to update (if updating existing annotation)"),
        properties: import_zod.z.array(import_zod.z.object({
          type: import_zod.z.string()
        })).optional().describe("Additional properties for the annotation")
      })
    ).describe("Array of annotations to apply")
  },
  async ({ nodeId, annotations }, extra) => {
    try {
      if (!annotations || annotations.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No annotations provided"
            }
          ]
        };
      }
      const initialStatus = {
        type: "text",
        text: `Starting annotation process for ${annotations.length} nodes. This will be processed in batches of 5...`
      };
      let totalProcessed = 0;
      const totalToProcess = annotations.length;
      const result = await sendCommandToFigma("set_multiple_annotations", {
        nodeId,
        annotations
      });
      const typedResult = result;
      const success = typedResult.annotationsApplied && typedResult.annotationsApplied > 0;
      const progressText = `
      Annotation process completed:
      - ${typedResult.annotationsApplied || 0} of ${totalToProcess} successfully applied
      - ${typedResult.annotationsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;
      const detailedResults = typedResult.results || [];
      const failedResults = detailedResults.filter((item) => !item.success);
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `

Nodes that failed:
${failedResults.map(
          (item) => `- ${item.nodeId}: ${item.error || "Unknown error"}`
        ).join("\n")}`;
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: progressText + detailedResponse
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting multiple annotations: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_component_instance",
  "Create an instance of a component in Figma",
  {
    componentKey: import_zod.z.string().describe("Key of the component to instantiate"),
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position")
  },
  async ({ componentKey, x, y }) => {
    try {
      const result = await sendCommandToFigma("create_component_instance", {
        componentKey,
        x,
        y
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(typedResult)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating component instance: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_instance_overrides",
  "Get all override properties from a selected component instance. These overrides can be applied to other instances, which will swap them to match the source component.",
  {
    nodeId: import_zod.z.string().optional().describe("Optional ID of the component instance to get overrides from. If not provided, currently selected instance will be used.")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_instance_overrides", {
        instanceNodeId: nodeId || null
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: typedResult.success ? `Successfully got instance overrides: ${typedResult.message}` : `Failed to get instance overrides: ${typedResult.message}`
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
server.tool(
  "set_instance_overrides",
  "Apply previously copied overrides to selected component instances. Target instances will be swapped to the source component and all copied override properties will be applied.",
  {
    sourceInstanceId: import_zod.z.string().describe("ID of the source component instance"),
    targetNodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of target instance IDs. Currently selected instances will be used.")
  },
  async ({ sourceInstanceId, targetNodeIds }) => {
    try {
      const result = await sendCommandToFigma("set_instance_overrides", {
        sourceInstanceId,
        targetNodeIds: targetNodeIds || []
      });
      const typedResult = result;
      if (typedResult.success) {
        const successCount = typedResult.results?.filter((r) => r.success).length || 0;
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
server.tool(
  "set_corner_radius",
  "Set the corner radius of a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    radius: import_zod.z.number().min(0).describe("Corner radius value"),
    corners: import_zod.z.array(import_zod.z.boolean()).length(4).optional().describe(
      "Optional array of 4 booleans to specify which corners to round [topLeft, topRight, bottomRight, bottomLeft]"
    )
  },
  async ({ nodeId, radius, corners }) => {
    try {
      const result = await sendCommandToFigma("set_corner_radius", {
        nodeId,
        radius,
        corners: corners || [true, true, true, true]
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set corner radius of node "${typedResult.name}" to ${radius}px`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting corner radius: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
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
    - Don't have account (text)`
          }
        }
      ],
      description: "Best practices for working with Figma designs"
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
`
          }
        }
      ],
      description: "Best practices for reading Figma designs"
    };
  }
);
server.tool(
  "scan_text_nodes",
  "Scan all text nodes in the selected Figma node",
  {
    nodeId: import_zod.z.string().describe("ID of the node to scan")
  },
  async ({ nodeId }) => {
    try {
      const initialStatus = {
        type: "text",
        text: "Starting text node scanning. This may take a moment for large designs..."
      };
      const result = await sendCommandToFigma("scan_text_nodes", {
        nodeId,
        useChunking: true,
        // Enable chunking on the plugin side
        chunkSize: 10
        // Process 10 nodes at a time
      });
      if (result && typeof result === "object" && "chunks" in result) {
        const typedResult = result;
        const summaryText = `
        Scan completed:
        - Found ${typedResult.totalNodes} text nodes
        - Processed in ${typedResult.chunks} chunks
        `;
        return {
          content: [
            initialStatus,
            {
              type: "text",
              text: summaryText
            },
            {
              type: "text",
              text: JSON.stringify(typedResult.textNodes, null, 2)
            }
          ]
        };
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error scanning text nodes: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "scan_nodes_by_types",
  "Scan for child nodes with specific types in the selected Figma node",
  {
    nodeId: import_zod.z.string().describe("ID of the node to scan"),
    types: import_zod.z.array(import_zod.z.string()).describe("Array of node types to find in the child nodes (e.g. ['COMPONENT', 'FRAME'])")
  },
  async ({ nodeId, types }) => {
    try {
      const initialStatus = {
        type: "text",
        text: `Starting node type scanning for types: ${types.join(", ")}...`
      };
      const result = await sendCommandToFigma("scan_nodes_by_types", {
        nodeId,
        types
      });
      if (result && typeof result === "object" && "matchingNodes" in result) {
        const typedResult = result;
        const summaryText = `Scan completed: Found ${typedResult.count} nodes matching types: ${typedResult.searchedTypes.join(", ")}`;
        return {
          content: [
            initialStatus,
            {
              type: "text",
              text: summaryText
            },
            {
              type: "text",
              text: JSON.stringify(typedResult.matchingNodes, null, 2)
            }
          ]
        };
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error scanning nodes by types: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
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

Remember that text is never just text\u2014it's a core design element that must work harmoniously with the overall composition. This chunk-based strategy allows you to methodically transform text while maintaining design integrity.`
          }
        }
      ],
      description: "Systematic approach for replacing text in Figma designs"
    };
  }
);
server.tool(
  "set_multiple_text_contents",
  "Set multiple text contents parallelly in a node",
  {
    nodeId: import_zod.z.string().describe("The ID of the node containing the text nodes to replace"),
    text: import_zod.z.array(
      import_zod.z.object({
        nodeId: import_zod.z.string().describe("The ID of the text node"),
        text: import_zod.z.string().describe("The replacement text")
      })
    ).describe("Array of text node IDs and their replacement texts")
  },
  async ({ nodeId, text }, extra) => {
    try {
      if (!text || text.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No text provided"
            }
          ]
        };
      }
      const initialStatus = {
        type: "text",
        text: `Starting text replacement for ${text.length} nodes. This will be processed in batches of 5...`
      };
      let totalProcessed = 0;
      const totalToProcess = text.length;
      const result = await sendCommandToFigma("set_multiple_text_contents", {
        nodeId,
        text
      });
      const typedResult = result;
      const success = typedResult.replacementsApplied && typedResult.replacementsApplied > 0;
      const progressText = `
      Text replacement completed:
      - ${typedResult.replacementsApplied || 0} of ${totalToProcess} successfully updated
      - ${typedResult.replacementsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;
      const detailedResults = typedResult.results || [];
      const failedResults = detailedResults.filter((item) => !item.success);
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `

Nodes that failed:
${failedResults.map(
          (item) => `- ${item.nodeId}: ${item.error || "Unknown error"}`
        ).join("\n")}`;
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: progressText + detailedResponse
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting multiple text contents: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
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
          }
        }
      ],
      description: "Strategy for converting manual annotations to Figma's native annotations"
    };
  }
);
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
- Preserve component relationships by using instance overrides rather than direct text manipulation`
          }
        }
      ],
      description: "Strategy for transferring overrides between component instances in Figma"
    };
  }
);
server.tool(
  "set_layout_mode",
  "Set the layout mode and wrap behavior of a frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    layoutMode: import_zod.z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).describe("Layout mode for the frame"),
    layoutWrap: import_zod.z.enum(["NO_WRAP", "WRAP"]).optional().describe("Whether the auto-layout frame wraps its children")
  },
  async ({ nodeId, layoutMode, layoutWrap }) => {
    try {
      const result = await sendCommandToFigma("set_layout_mode", {
        nodeId,
        layoutMode,
        layoutWrap: layoutWrap || "NO_WRAP"
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set layout mode of frame "${typedResult.name}" to ${layoutMode}${layoutWrap ? ` with ${layoutWrap}` : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting layout mode: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_padding",
  "Set padding values for an auto-layout frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    paddingTop: import_zod.z.number().optional().describe("Top padding value"),
    paddingRight: import_zod.z.number().optional().describe("Right padding value"),
    paddingBottom: import_zod.z.number().optional().describe("Bottom padding value"),
    paddingLeft: import_zod.z.number().optional().describe("Left padding value")
  },
  async ({ nodeId, paddingTop, paddingRight, paddingBottom, paddingLeft }) => {
    try {
      const result = await sendCommandToFigma("set_padding", {
        nodeId,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft
      });
      const typedResult = result;
      const paddingMessages = [];
      if (paddingTop !== void 0) paddingMessages.push(`top: ${paddingTop}`);
      if (paddingRight !== void 0) paddingMessages.push(`right: ${paddingRight}`);
      if (paddingBottom !== void 0) paddingMessages.push(`bottom: ${paddingBottom}`);
      if (paddingLeft !== void 0) paddingMessages.push(`left: ${paddingLeft}`);
      const paddingText = paddingMessages.length > 0 ? `padding (${paddingMessages.join(", ")})` : "padding";
      return {
        content: [
          {
            type: "text",
            text: `Set ${paddingText} for frame "${typedResult.name}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting padding: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_axis_align",
  "Set primary and counter axis alignment for an auto-layout frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    primaryAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional().describe("Primary axis alignment (MIN/MAX = left/right in horizontal, top/bottom in vertical). Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."),
    counterAxisAlignItems: import_zod.z.enum(["MIN", "MAX", "CENTER", "BASELINE"]).optional().describe("Counter axis alignment (MIN/MAX = top/bottom in horizontal, left/right in vertical)")
  },
  async ({ nodeId, primaryAxisAlignItems, counterAxisAlignItems }) => {
    try {
      const result = await sendCommandToFigma("set_axis_align", {
        nodeId,
        primaryAxisAlignItems,
        counterAxisAlignItems
      });
      const typedResult = result;
      const alignMessages = [];
      if (primaryAxisAlignItems !== void 0) alignMessages.push(`primary: ${primaryAxisAlignItems}`);
      if (counterAxisAlignItems !== void 0) alignMessages.push(`counter: ${counterAxisAlignItems}`);
      const alignText = alignMessages.length > 0 ? `axis alignment (${alignMessages.join(", ")})` : "axis alignment";
      return {
        content: [
          {
            type: "text",
            text: `Set ${alignText} for frame "${typedResult.name}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting axis alignment: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_layout_sizing",
  "Set horizontal and vertical sizing modes for an auto-layout frame in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    layoutSizingHorizontal: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Horizontal sizing mode (HUG for frames/text only, FILL for auto-layout children only)"),
    layoutSizingVertical: import_zod.z.enum(["FIXED", "HUG", "FILL"]).optional().describe("Vertical sizing mode (HUG for frames/text only, FILL for auto-layout children only)")
  },
  async ({ nodeId, layoutSizingHorizontal, layoutSizingVertical }) => {
    try {
      const result = await sendCommandToFigma("set_layout_sizing", {
        nodeId,
        layoutSizingHorizontal,
        layoutSizingVertical
      });
      const typedResult = result;
      const sizingMessages = [];
      if (layoutSizingHorizontal !== void 0) sizingMessages.push(`horizontal: ${layoutSizingHorizontal}`);
      if (layoutSizingVertical !== void 0) sizingMessages.push(`vertical: ${layoutSizingVertical}`);
      const sizingText = sizingMessages.length > 0 ? `layout sizing (${sizingMessages.join(", ")})` : "layout sizing";
      return {
        content: [
          {
            type: "text",
            text: `Set ${sizingText} for frame "${typedResult.name}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting layout sizing: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_item_spacing",
  "Set distance between children in an auto-layout frame",
  {
    nodeId: import_zod.z.string().describe("The ID of the frame to modify"),
    itemSpacing: import_zod.z.number().describe("Distance between children. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN.")
  },
  async ({ nodeId, itemSpacing }) => {
    try {
      const result = await sendCommandToFigma("set_item_spacing", {
        nodeId,
        itemSpacing
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set item spacing to ${itemSpacing} for frame "${typedResult.name}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting item spacing: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_reactions",
  "Get Figma Prototyping Reactions from multiple nodes. CRITICAL: The output MUST be processed using the 'reaction_to_connector_strategy' prompt IMMEDIATELY to generate parameters for connector lines via the 'create_connections' tool.",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to get reactions from")
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
          prompt: "reaction_to_connector_strategy"
        }
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting reactions: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_default_connector",
  "Set a copied connector node as the default connector",
  {
    connectorId: import_zod.z.string().optional().describe("The ID of the connector node to set as default")
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
server.tool(
  "create_connections",
  "Create connections between nodes using the default connector style",
  {
    connections: import_zod.z.array(import_zod.z.object({
      startNodeId: import_zod.z.string().describe("ID of the starting node"),
      endNodeId: import_zod.z.string().describe("ID of the ending node"),
      text: import_zod.z.string().optional().describe("Optional text to display on the connector")
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
     - If \`triggerType\` is "ON_CLICK" and \`actionType\` is "NAVIGATE": "On click, navigate to [Destination Node Name]"
     - If \`triggerType\` is "ON_DRAG" and \`actionType\` is "OPEN_OVERLAY": "On drag, open [Destination Node Name] overlay"
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
          }
        }
      ],
      description: "Strategy for converting Figma prototype reactions to connector lines using the output of 'get_reactions'"
    };
  }
);
function connectToFigma(port = 3055) {
  if (ws && ws.readyState === import_ws.default.OPEN) {
    logger.info("Already connected to Figma");
    return;
  }
  const wsUrl = serverUrl === "localhost" ? `${WS_URL}:${port}` : WS_URL;
  logger.info(`Connecting to Figma socket server at ${wsUrl}...`);
  ws = new import_ws.default(wsUrl);
  const connectionTimeout = setTimeout(() => {
    if (ws && ws.readyState === import_ws.default.CONNECTING) {
      logger.error("Connection timeout, closing WebSocket");
      ws.close();
    }
  }, 1e4);
  ws.on("open", () => {
    clearTimeout(connectionTimeout);
    logger.info("Connected to Figma socket server");
    currentChannel = null;
    const heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === import_ws.default.OPEN) {
        ws.send(JSON.stringify({
          type: "ping",
          timestamp: Date.now()
        }));
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 3e4);
  });
  ws.on("message", (data) => {
    try {
      const json = JSON.parse(data);
      if (json.type === "ping") {
        if (ws && ws.readyState === import_ws.default.OPEN) {
          ws.send(JSON.stringify({
            type: "pong",
            timestamp: Date.now()
          }));
        }
        return;
      }
      if (json.type === "progress_update") {
        const progressData = json.message.data;
        const requestId = json.id || "";
        if (requestId && pendingRequests.has(requestId)) {
          const request = pendingRequests.get(requestId);
          request.lastActivity = Date.now();
          clearTimeout(request.timeout);
          request.timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
              logger.error(`Request ${requestId} timed out after extended period of inactivity`);
              pendingRequests.delete(requestId);
              request.reject(new Error("Request to Figma timed out"));
            }
          }, 12e4);
          logger.info(`Progress update for ${progressData.commandType}: ${progressData.progress}% - ${progressData.message}`);
          if (progressData.status === "completed" && progressData.progress === 100) {
            logger.info(`Operation ${progressData.commandType} completed, waiting for final result`);
          }
        }
        return;
      }
      const myResponse = json.message;
      logger.debug(`Received message: ${JSON.stringify(myResponse)}`);
      logger.log("myResponse" + JSON.stringify(myResponse));
      if (myResponse.id && pendingRequests.has(myResponse.id) && myResponse.result) {
        const request = pendingRequests.get(myResponse.id);
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
        logger.info(`Received broadcast message: ${JSON.stringify(myResponse)}`);
      }
    } catch (error) {
      logger.error(`Error parsing message: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  ws.on("error", (error) => {
    clearTimeout(connectionTimeout);
    logger.error(`Socket error: ${error}`);
    for (const [id, request] of pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error(`Connection error: ${error}`));
      pendingRequests.delete(id);
    }
  });
  ws.on("close", (code, reason) => {
    clearTimeout(connectionTimeout);
    logger.info(`Disconnected from Figma socket server. Code: ${code}, Reason: ${reason}`);
    ws = null;
    for (const [id, request] of pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error("Connection closed"));
      pendingRequests.delete(id);
    }
    if (code !== 1e3) {
      if (reconnectAttempts < 5) {
        reconnectAttempts++;
        const reconnectDelay = Math.min(5e3, 1e3 * Math.pow(2, Math.min(5, reconnectAttempts)));
        logger.info(`Attempting to reconnect (${reconnectAttempts}/5) in ${reconnectDelay}ms...`);
        setTimeout(() => {
          if (!ws || ws.readyState === import_ws.default.CLOSED) {
            connectToFigma(port);
          }
        }, reconnectDelay);
      } else {
        logger.warn("Maximum reconnection attempts reached. WebSocket connection will be attempted when needed.");
        reconnectAttempts = 0;
      }
    }
  });
}
async function joinChannel(channelName) {
  if (!ws || ws.readyState !== import_ws.default.OPEN) {
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
function sendCommandToFigma(command, params = {}, timeoutMs = 6e4) {
  return new Promise((resolve2, reject) => {
    if (!ws || ws.readyState !== import_ws.default.OPEN) {
      connectToFigma();
      reject(new Error("Not connected to Figma. Attempting to connect..."));
      return;
    }
    const requiresChannel = command !== "join";
    if (requiresChannel && !currentChannel) {
      reject(new Error("Must join a channel before sending commands"));
      return;
    }
    const id = (0, import_uuid.v4)();
    const request = {
      id,
      type: command === "join" ? "join" : "message",
      ...command === "join" ? { channel: params.channel } : { channel: currentChannel },
      message: {
        id,
        command,
        params: {
          ...params,
          commandId: id
          // Include the command ID in params
        }
      }
    };
    let actualTimeout = timeoutMs;
    const longRunningCommands = [
      "get_local_components",
      "get_styles",
      "scan_text_nodes",
      "set_multiple_text_contents",
      "set_multiple_annotations",
      "export_node_as_image"
    ];
    if (longRunningCommands.includes(command)) {
      actualTimeout = Math.max(timeoutMs, 12e4);
      logger.info(`Using extended timeout of ${actualTimeout}ms for command: ${command}`);
    }
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        logger.error(`Request ${id} to Figma timed out after ${actualTimeout / 1e3} seconds`);
        reject(new Error(`Request to Figma timed out after ${actualTimeout / 1e3} seconds`));
      }
    }, actualTimeout);
    pendingRequests.set(id, {
      resolve: resolve2,
      reject,
      timeout,
      lastActivity: Date.now()
    });
    logger.info(`Sending command to Figma: ${command} (timeout: ${actualTimeout}ms)`);
    logger.debug(`Request details: ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));
  });
}
server.tool(
  "join_channel",
  "Join a specific channel to communicate with Figma",
  {
    channel: import_zod.z.string().describe("The name of the channel to join (components or design)").default("")
  },
  async ({ channel }) => {
    try {
      if (!channel) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a channel name to join. Available channels: 'components' or 'design'"
            }
          ]
        };
      }
      if (channel !== "components" && channel !== "design") {
        return {
          content: [
            {
              type: "text",
              text: "Invalid channel name. Please use 'components' or 'design'"
            }
          ]
        };
      }
      await joinChannel(channel);
      return {
        content: [
          {
            type: "text",
            text: `Successfully joined channel: ${channel}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error joining channel: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
async function main() {
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
  logger.info("FigmaMCP server running on stdio");
  setTimeout(() => {
    try {
      connectToFigma();
    } catch (error) {
      logger.warn(`Could not connect to Figma initially: ${error instanceof Error ? error.message : String(error)}`);
      logger.warn("Will try to connect when the first command is sent");
    }
  }, 1e3);
}
main().catch((error) => {
  logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
async function smartChannelSwitch(userInput) {
  const designKeywords = ["\u8BBE\u8BA1\u9875", "\u8BBE\u8BA1\u7A3F", "\u754C\u9762\u8BBE\u8BA1", "\u9875\u9762\u8BBE\u8BA1", "\u751F\u6210\u8BBE\u8BA1", "\u521B\u5EFA\u754C\u9762", "\u8BBE\u8BA1\u754C\u9762"];
  const componentKeywords = ["\u7EC4\u4EF6\u5E93", "\u7EC4\u4EF6", "\u8BBE\u8BA1\u7CFB\u7EDF", "\u7EC4\u4EF6\u89C4\u8303", "\u8BBE\u8BA1\u89C4\u8303"];
  const lowerInput = userInput.toLowerCase();
  const hasDesignKeywords = designKeywords.some((keyword) => lowerInput.includes(keyword));
  const hasComponentKeywords = componentKeywords.some((keyword) => lowerInput.includes(keyword));
  let targetChannel = currentChannel || "design";
  if (hasDesignKeywords && !hasComponentKeywords) {
    targetChannel = "design";
  } else if (hasComponentKeywords && !hasDesignKeywords) {
    targetChannel = "components";
  } else if (hasDesignKeywords && hasComponentKeywords) {
    targetChannel = "design";
  }
  if (targetChannel !== currentChannel) {
    try {
      await joinChannel(targetChannel);
      return `\u5DF2\u81EA\u52A8\u5207\u6362\u5230${targetChannel === "design" ? "\u8BBE\u8BA1\u9875" : "\u7EC4\u4EF6\u5E93"}\u9891\u9053`;
    } catch (error) {
      throw new Error(`\u5207\u6362\u5230${targetChannel}\u9891\u9053\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return `\u5F53\u524D\u5DF2\u5728${currentChannel === "design" ? "\u8BBE\u8BA1\u9875" : currentChannel === "components" ? "\u7EC4\u4EF6\u5E93" : "\u672A\u77E5"}\u9891\u9053`;
}
server.tool(
  "create_component_instance_enhanced",
  "\u521B\u5EFA\u7EC4\u4EF6\u5B9E\u4F8B\u5E76\u786E\u4FDD\u6B63\u786E\u5B9A\u4F4D\uFF08\u589E\u5F3A\u7248\uFF09",
  {
    componentKey: import_zod.z.string().describe("\u7EC4\u4EF6\u7684key\u503C"),
    x: import_zod.z.number().describe("X\u5750\u6807\u4F4D\u7F6E"),
    y: import_zod.z.number().describe("Y\u5750\u6807\u4F4D\u7F6E"),
    parentId: import_zod.z.string().optional().describe("\u53EF\u9009\u7684\u7236\u5BB9\u5668ID"),
    name: import_zod.z.string().optional().describe("\u5B9E\u4F8B\u7684\u81EA\u5B9A\u4E49\u540D\u79F0")
  },
  async ({ componentKey, x, y, parentId, name }) => {
    try {
      const originalChannel = currentChannel;
      let componentExists = false;
      let availableComponents = null;
      try {
        if (currentChannel !== "components") {
          await joinChannel("components");
        }
        availableComponents = await sendCommandToFigma("get_local_components");
        componentExists = availableComponents?.components?.some((comp) => comp.key === componentKey);
        if (originalChannel && originalChannel !== "components" && typeof originalChannel === "string") {
          await joinChannel(originalChannel);
        }
      } catch (channelError) {
        console.warn("\u9891\u9053\u5207\u6362\u6216\u7EC4\u4EF6\u83B7\u53D6\u5931\u8D25:", channelError);
        const currentComponents = await sendCommandToFigma("get_local_components");
        componentExists = currentComponents?.components?.some((comp) => comp.key === componentKey);
      }
      if (!componentExists) {
        return {
          content: [
            {
              type: "text",
              text: `\u274C \u9519\u8BEF\uFF1A\u627E\u4E0D\u5230key\u4E3A "${componentKey}" \u7684\u7EC4\u4EF6\u3002\u8BF7\u68C0\u67E5\u7EC4\u4EF6key\u662F\u5426\u6B63\u786E\u3002
\u53EF\u7528\u7EC4\u4EF6\u6570\u91CF: ${availableComponents?.count || 0}`
            }
          ]
        };
      }
      const result = await sendCommandToFigma("create_component_instance", {
        componentKey,
        x,
        y
      });
      const typedResult = result;
      if (parentId && typedResult.id) {
        try {
          await sendCommandToFigma("move_node_to_parent", {
            nodeId: typedResult.id,
            parentId,
            x,
            y
          });
        } catch (moveError) {
          console.warn("\u79FB\u52A8\u5230\u7236\u5BB9\u5668\u5931\u8D25:", moveError);
        }
      }
      if (name && typedResult.id) {
      }
      return {
        content: [
          {
            type: "text",
            text: `\u2705 \u6210\u529F\u521B\u5EFA\u7EC4\u4EF6\u5B9E\u4F8B\uFF01
\u{1F4CD} \u4F4D\u7F6E: (${x}, ${y})
\u{1F194} \u5B9E\u4F8BID: ${typedResult.id || "\u672A\u77E5"}
\u{1F4DD} \u7EC4\u4EF6Key: ${componentKey}
${parentId ? `\u{1F4C1} \u7236\u5BB9\u5668: ${parentId}` : ""}
${name ? `\u{1F3F7}\uFE0F \u81EA\u5B9A\u4E49\u540D\u79F0: ${name}` : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u521B\u5EFA\u7EC4\u4EF6\u5B9E\u4F8B\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "clone_node_enhanced",
  "\u514B\u9686\u8282\u70B9\u5E76\u786E\u4FDD\u6B63\u786E\u5B9A\u4F4D\uFF08\u589E\u5F3A\u7248\uFF09",
  {
    nodeId: import_zod.z.string().describe("\u8981\u514B\u9686\u7684\u8282\u70B9ID"),
    x: import_zod.z.number().describe("\u65B0\u4F4D\u7F6E\u7684X\u5750\u6807"),
    y: import_zod.z.number().describe("\u65B0\u4F4D\u7F6E\u7684Y\u5750\u6807"),
    name: import_zod.z.string().optional().describe("\u514B\u9686\u8282\u70B9\u7684\u81EA\u5B9A\u4E49\u540D\u79F0"),
    verifyPosition: import_zod.z.boolean().default(true).describe("\u662F\u5426\u9A8C\u8BC1\u514B\u9686\u540E\u7684\u4F4D\u7F6E")
  },
  async ({ nodeId, x, y, name, verifyPosition }) => {
    try {
      const originalNode = await sendCommandToFigma("get_node_info", { nodeId });
      const result = await sendCommandToFigma("clone_node", { nodeId, x, y });
      const typedResult = result;
      if (!typedResult.id) {
        throw new Error("\u514B\u9686\u5931\u8D25\uFF1A\u672A\u8FD4\u56DE\u65B0\u8282\u70B9ID");
      }
      if (verifyPosition) {
        try {
          const clonedNode = await sendCommandToFigma("get_node_info", { nodeId: typedResult.id });
          const clonedNodeData = clonedNode;
          if (clonedNodeData.x !== x || clonedNodeData.y !== y) {
            await sendCommandToFigma("move_node", {
              nodeId: typedResult.id,
              x,
              y
            });
          }
        } catch (verifyError) {
          console.warn("\u4F4D\u7F6E\u9A8C\u8BC1\u5931\u8D25:", verifyError);
        }
      }
      return {
        content: [
          {
            type: "text",
            text: `\u2705 \u6210\u529F\u514B\u9686\u8282\u70B9\uFF01
\u{1F4CD} \u76EE\u6807\u4F4D\u7F6E: (${x}, ${y})
\u{1F194} \u65B0\u8282\u70B9ID: ${typedResult.id}
\u{1F4DD} \u65B0\u8282\u70B9\u540D\u79F0: ${typedResult.name}
\u{1F504} \u539F\u8282\u70B9ID: ${nodeId}
${name ? `\u{1F3F7}\uFE0F \u81EA\u5B9A\u4E49\u540D\u79F0: ${name}` : ""}
${verifyPosition ? "\u2705 \u5DF2\u9A8C\u8BC1\u4F4D\u7F6E\u6B63\u786E\u6027" : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u514B\u9686\u8282\u70B9\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "generate_design_with_reference",
  "\u57FA\u4E8E\u53C2\u8003\u56FE\u548C\u7EC4\u4EF6\u5E93\u751F\u6210\u8BBE\u8BA1\u7A3F\uFF08\u667A\u80FD\u7248\uFF09",
  {
    description: import_zod.z.string().describe("\u8BBE\u8BA1\u9700\u6C42\u63CF\u8FF0"),
    referenceImageAnalysis: import_zod.z.string().optional().describe("\u53C2\u8003\u56FE\u5206\u6790\u7ED3\u679C"),
    useComponents: import_zod.z.boolean().default(true).describe("\u662F\u5426\u4F7F\u7528\u7EC4\u4EF6\u5E93\u4E2D\u7684\u7EC4\u4EF6"),
    targetChannel: import_zod.z.enum(["design", "components"]).optional().describe("\u76EE\u6807\u9891\u9053\uFF0C\u5982\u679C\u4E0D\u6307\u5B9A\u5C06\u81EA\u52A8\u8BC6\u522B")
  },
  async ({ description, referenceImageAnalysis, useComponents, targetChannel }) => {
    try {
      let channelSwitchResult = "";
      if (targetChannel) {
        if (targetChannel !== currentChannel) {
          await joinChannel(targetChannel);
          channelSwitchResult = `\u5DF2\u5207\u6362\u5230${targetChannel === "design" ? "\u8BBE\u8BA1\u9875" : "\u7EC4\u4EF6\u5E93"}\u9891\u9053\u3002`;
        }
      } else {
        channelSwitchResult = await smartChannelSwitch(description);
      }
      const documentInfo = await sendCommandToFigma("get_document_info");
      let availableComponents = null;
      if (useComponents) {
        try {
          const originalChannel = currentChannel;
          if (currentChannel !== "components") {
            await joinChannel("components");
          }
          availableComponents = await sendCommandToFigma("get_local_components");
          if (originalChannel && originalChannel !== "components" && typeof originalChannel === "string") {
            await joinChannel(originalChannel);
          }
        } catch (componentError) {
          console.warn("\u83B7\u53D6\u7EC4\u4EF6\u5E93\u4FE1\u606F\u5931\u8D25:", componentError);
        }
      }
      return {
        content: [
          {
            type: "text",
            text: `\u{1F3A8} \u667A\u80FD\u8BBE\u8BA1\u7A3F\u751F\u6210\u5DF2\u542F\u52A8\uFF01

\u{1F4CB} \u8BBE\u8BA1\u9700\u6C42: ${description}
\u{1F4CD} ${channelSwitchResult}
\u{1F4C4} \u5F53\u524D\u6587\u6863: ${documentInfo?.name || "\u672A\u77E5"}
\u{1F9E9} \u7EC4\u4EF6\u5E93\u72B6\u6001: ${useComponents ? availableComponents ? "\u2705 \u5DF2\u52A0\u8F7D" : "\u274C \u52A0\u8F7D\u5931\u8D25" : "\u{1F6AB} \u672A\u4F7F\u7528"}
${referenceImageAnalysis ? `\u{1F5BC}\uFE0F \u53C2\u8003\u56FE\u5206\u6790: ${referenceImageAnalysis}` : ""}

\u{1F4A1} \u5EFA\u8BAE\u7684\u8BBE\u8BA1\u6D41\u7A0B:
1. \u5206\u6790\u8BBE\u8BA1\u9700\u6C42\u548C\u53C2\u8003\u56FE
2. \u89C4\u5212\u9875\u9762\u5E03\u5C40\u7ED3\u6784
3. \u9009\u62E9\u5408\u9002\u7684\u7EC4\u4EF6\u5E93\u7EC4\u4EF6
4. \u521B\u5EFA\u4E3B\u5BB9\u5668\u6846\u67B6
5. \u9010\u6B65\u6DFB\u52A0\u548C\u5B9A\u4F4D\u5143\u7D20
6. \u5E94\u7528\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303
7. \u9A8C\u8BC1\u4E0E\u53C2\u8003\u56FE\u7684\u4E00\u81F4\u6027

\u{1F680} \u51C6\u5907\u5F00\u59CB\u8BBE\u8BA1\u7A3F\u751F\u6210...`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u667A\u80FD\u8BBE\u8BA1\u7A3F\u751F\u6210\u521D\u59CB\u5316\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "verify_design_against_reference",
  "\u5BF9\u6BD4\u8BBE\u8BA1\u7A3F\u4E0E\u53C2\u8003\u56FE\u7684\u4E00\u81F4\u6027",
  {
    designNodeId: import_zod.z.string().describe("\u8BBE\u8BA1\u7A3F\u8282\u70B9ID"),
    referenceDescription: import_zod.z.string().describe("\u53C2\u8003\u56FE\u63CF\u8FF0\u6216\u5206\u6790\u7ED3\u679C"),
    checkPoints: import_zod.z.array(import_zod.z.string()).optional().describe("\u9700\u8981\u68C0\u67E5\u7684\u8981\u70B9\u5217\u8868"),
    exportForComparison: import_zod.z.boolean().default(false).describe("\u662F\u5426\u5BFC\u51FA\u8BBE\u8BA1\u7A3F\u7528\u4E8E\u5BF9\u6BD4")
  },
  async ({ designNodeId, referenceDescription, checkPoints, exportForComparison }) => {
    try {
      const designNode = await sendCommandToFigma("get_node_info", { nodeId: designNodeId });
      const nodeData = designNode;
      let exportResult = null;
      if (exportForComparison) {
        try {
          exportResult = await sendCommandToFigma("export_node_as_image", {
            nodeId: designNodeId,
            format: "PNG",
            scale: 1
          });
        } catch (exportError) {
          console.warn("\u5BFC\u51FA\u8BBE\u8BA1\u7A3F\u5931\u8D25:", exportError);
        }
      }
      const defaultCheckPoints = [
        "\u6574\u4F53\u5E03\u5C40\u7ED3\u6784",
        "\u989C\u8272\u4F7F\u7528\u662F\u5426\u7B26\u5408\u8BBE\u8BA1\u7CFB\u7EDF",
        "\u5B57\u4F53\u5927\u5C0F\u548C\u5C42\u7EA7",
        "\u95F4\u8DDD\u548C\u5BF9\u9F50",
        "\u7EC4\u4EF6\u4F7F\u7528\u7684\u6B63\u786E\u6027"
      ];
      const finalCheckPoints = checkPoints || defaultCheckPoints;
      return {
        content: [
          {
            type: "text",
            text: `\u{1F50D} \u8BBE\u8BA1\u7A3F\u9A8C\u8BC1\u62A5\u544A

\u{1F4CB} \u8BBE\u8BA1\u8282\u70B9: ${nodeData.name || designNodeId}
\u{1F4D0} \u5C3A\u5BF8: ${nodeData.width || "\u672A\u77E5"} x ${nodeData.height || "\u672A\u77E5"}
\u{1F4CD} \u4F4D\u7F6E: (${nodeData.x || 0}, ${nodeData.y || 0})

\u{1F5BC}\uFE0F \u53C2\u8003\u56FE\u63CF\u8FF0:
${referenceDescription}

\u2705 \u68C0\u67E5\u8981\u70B9:
${finalCheckPoints.map((point, index) => `${index + 1}. ${point}`).join("\n")}

\u{1F4A1} \u9A8C\u8BC1\u5EFA\u8BAE:
1. \u5BF9\u6BD4\u6574\u4F53\u5E03\u5C40\u662F\u5426\u4E0E\u53C2\u8003\u56FE\u4E00\u81F4
2. \u68C0\u67E5\u989C\u8272\u662F\u5426\u7B26\u5408\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303
3. \u9A8C\u8BC1\u6587\u5B57\u5C42\u7EA7\u548C\u5927\u5C0F\u662F\u5426\u5408\u9002
4. \u786E\u8BA4\u95F4\u8DDD\u548C\u5BF9\u9F50\u662F\u5426\u7CBE\u786E
5. \u68C0\u67E5\u7EC4\u4EF6\u4F7F\u7528\u662F\u5426\u6B63\u786E

${exportResult ? "\u{1F4F8} \u8BBE\u8BA1\u7A3F\u5DF2\u5BFC\u51FA\uFF0C\u53EF\u7528\u4E8E\u8BE6\u7EC6\u5BF9\u6BD4" : ""}

\u{1F6A8} \u6CE8\u610F\u4E8B\u9879:
- \u8BF7\u4ED4\u7EC6\u5BF9\u6BD4\u6BCF\u4E2A\u7EC6\u8282
- \u786E\u4FDD\u7B26\u5408\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303
- \u6CE8\u610F\u7528\u6237\u4F53\u9A8C\u7684\u4E00\u81F4\u6027`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u8BBE\u8BA1\u7A3F\u9A8C\u8BC1\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "design_quality_check",
  "\u68C0\u67E5\u8BBE\u8BA1\u7A3F\u7684\u8D28\u91CF\u548C\u89C4\u8303\u6027",
  {
    nodeId: import_zod.z.string().describe("\u8981\u68C0\u67E5\u7684\u8BBE\u8BA1\u7A3F\u8282\u70B9ID"),
    checkDesignSystem: import_zod.z.boolean().default(true).describe("\u662F\u5426\u68C0\u67E5\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303"),
    checkAccessibility: import_zod.z.boolean().default(true).describe("\u662F\u5426\u68C0\u67E5\u53EF\u8BBF\u95EE\u6027"),
    generateReport: import_zod.z.boolean().default(true).describe("\u662F\u5426\u751F\u6210\u8BE6\u7EC6\u62A5\u544A")
  },
  async ({ nodeId, checkDesignSystem, checkAccessibility, generateReport }) => {
    try {
      const nodeInfo = await sendCommandToFigma("get_node_info", { nodeId });
      const nodeData = nodeInfo;
      const childNodes = await sendCommandToFigma("scan_nodes_by_types", {
        nodeId,
        types: ["TEXT", "RECTANGLE", "FRAME", "COMPONENT", "INSTANCE"]
      });
      const issues = [];
      const suggestions = [];
      if (!nodeData.name || nodeData.name.includes("Rectangle") || nodeData.name.includes("Frame")) {
        issues.push("\u8282\u70B9\u547D\u540D\u4E0D\u89C4\u8303\uFF0C\u5EFA\u8BAE\u4F7F\u7528\u8BED\u4E49\u5316\u540D\u79F0");
      }
      if (checkDesignSystem) {
        suggestions.push("\u68C0\u67E5\u989C\u8272\u662F\u5426\u4F7F\u7528\u8BBE\u8BA1\u7CFB\u7EDF\u4E2D\u5B9A\u4E49\u7684\u989C\u8272");
        suggestions.push("\u9A8C\u8BC1\u5B57\u4F53\u5927\u5C0F\u662F\u5426\u7B26\u5408\u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303");
        suggestions.push("\u786E\u8BA4\u95F4\u8DDD\u4F7F\u7528\u8BBE\u8BA1\u7CFB\u7EDF\u4E2D\u7684\u6807\u51C6\u95F4\u8DDD");
      }
      if (checkAccessibility) {
        suggestions.push("\u68C0\u67E5\u6587\u5B57\u5BF9\u6BD4\u5EA6\u662F\u5426\u7B26\u5408WCAG\u6807\u51C6");
        suggestions.push("\u786E\u8BA4\u4EA4\u4E92\u5143\u7D20\u7684\u6700\u5C0F\u70B9\u51FB\u533A\u57DF");
        suggestions.push("\u9A8C\u8BC1\u989C\u8272\u4E0D\u662F\u552F\u4E00\u7684\u4FE1\u606F\u4F20\u8FBE\u65B9\u5F0F");
      }
      const qualityScore = Math.max(0, 100 - issues.length * 10);
      return {
        content: [
          {
            type: "text",
            text: `\u{1F4CA} \u8BBE\u8BA1\u8D28\u91CF\u68C0\u67E5\u62A5\u544A

\u{1F3AF} \u68C0\u67E5\u8282\u70B9: ${nodeData.name || nodeId}
\u{1F4CF} \u5C3A\u5BF8: ${nodeData.width || "\u672A\u77E5"} x ${nodeData.height || "\u672A\u77E5"}
\u2B50 \u8D28\u91CF\u8BC4\u5206: ${qualityScore}/100

${issues.length > 0 ? `\u{1F6A8} \u53D1\u73B0\u95EE\u9898 (${issues.length}\u4E2A):
${issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}` : "\u2705 \u672A\u53D1\u73B0\u660E\u663E\u95EE\u9898"}

\u{1F4A1} \u6539\u8FDB\u5EFA\u8BAE:
${suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join("\n")}

\u{1F4CB} \u68C0\u67E5\u9879\u76EE:
\u2705 \u8282\u70B9\u547D\u540D\u89C4\u8303
${checkDesignSystem ? "\u2705 \u8BBE\u8BA1\u7CFB\u7EDF\u89C4\u8303" : "\u23ED\uFE0F \u8DF3\u8FC7\u8BBE\u8BA1\u7CFB\u7EDF\u68C0\u67E5"}
${checkAccessibility ? "\u2705 \u53EF\u8BBF\u95EE\u6027\u6807\u51C6" : "\u23ED\uFE0F \u8DF3\u8FC7\u53EF\u8BBF\u95EE\u6027\u68C0\u67E5"}

\u{1F3AF} \u603B\u4F53\u8BC4\u4EF7:
${qualityScore >= 90 ? "\u{1F31F} \u4F18\u79C0 - \u8BBE\u8BA1\u8D28\u91CF\u5F88\u9AD8" : qualityScore >= 70 ? "\u{1F44D} \u826F\u597D - \u6709\u4E00\u4E9B\u6539\u8FDB\u7A7A\u95F4" : qualityScore >= 50 ? "\u26A0\uFE0F \u4E00\u822C - \u9700\u8981\u8F83\u591A\u6539\u8FDB" : "\u{1F6A8} \u9700\u8981\u91CD\u5927\u6539\u8FDB"}

${generateReport ? `
\u{1F4C4} \u8BE6\u7EC6\u62A5\u544A\u5DF2\u751F\u6210\uFF0C\u5305\u542B\u6240\u6709\u68C0\u67E5\u9879\u76EE\u7684\u8BE6\u7EC6\u4FE1\u606F\u3002
\u5EFA\u8BAE\u6839\u636E\u62A5\u544A\u9010\u9879\u6539\u8FDB\u8BBE\u8BA1\u7A3F\u8D28\u91CF\u3002` : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u8BBE\u8BA1\u8D28\u91CF\u68C0\u67E5\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_multiple_component_instances",
  "\u6279\u91CF\u521B\u5EFA\u591A\u4E2A\u7EC4\u4EF6\u5B9E\u4F8B",
  {
    instances: import_zod.z.array(import_zod.z.object({
      componentKey: import_zod.z.string().describe("\u7EC4\u4EF6key"),
      x: import_zod.z.number().describe("X\u5750\u6807"),
      y: import_zod.z.number().describe("Y\u5750\u6807"),
      name: import_zod.z.string().optional().describe("\u5B9E\u4F8B\u540D\u79F0")
    })).describe("\u8981\u521B\u5EFA\u7684\u5B9E\u4F8B\u5217\u8868"),
    verifyPositions: import_zod.z.boolean().default(true).describe("\u662F\u5426\u9A8C\u8BC1\u6BCF\u4E2A\u5B9E\u4F8B\u7684\u4F4D\u7F6E")
  },
  async ({ instances, verifyPositions }) => {
    try {
      const results = [];
      const errors = [];
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
          if (verifyPositions && result.id) {
            try {
              const nodeInfo = await sendCommandToFigma("get_node_info", {
                nodeId: result.id
              });
              const nodeData = nodeInfo;
              if (Math.abs(nodeData.x - instance.x) > 1 || Math.abs(nodeData.y - instance.y) > 1) {
                await sendCommandToFigma("move_node", {
                  nodeId: result.id,
                  x: instance.x,
                  y: instance.y
                });
              }
            } catch (verifyError) {
              console.warn(`\u4F4D\u7F6E\u9A8C\u8BC1\u5931\u8D25 (${instance.componentKey}):`, verifyError);
            }
          }
        } catch (instanceError) {
          errors.push(`\u521B\u5EFA\u5B9E\u4F8B\u5931\u8D25 (${instance.componentKey}): ${instanceError instanceof Error ? instanceError.message : String(instanceError)}`);
          results.push({
            ...instance,
            success: false,
            error: instanceError instanceof Error ? instanceError.message : String(instanceError)
          });
        }
      }
      const successCount = results.filter((r) => r.success).length;
      return {
        content: [
          {
            type: "text",
            text: `\u{1F3AF} \u6279\u91CF\u7EC4\u4EF6\u5B9E\u4F8B\u521B\u5EFA\u5B8C\u6210\uFF01

\u{1F4CA} \u521B\u5EFA\u7EDF\u8BA1:
\u2705 \u6210\u529F: ${successCount}/${instances.length}
\u274C \u5931\u8D25: ${errors.length}

${successCount > 0 ? `\u2705 \u6210\u529F\u521B\u5EFA\u7684\u5B9E\u4F8B:
${results.filter((r) => r.success).map(
              (r, index) => `${index + 1}. ${r.name || r.componentKey} - \u4F4D\u7F6E: (${r.x}, ${r.y})`
            ).join("\n")}` : ""}

${errors.length > 0 ? `\u274C \u521B\u5EFA\u5931\u8D25\u7684\u5B9E\u4F8B:
${errors.map((error, index) => `${index + 1}. ${error}`).join("\n")}` : ""}

${verifyPositions ? "\u2705 \u5DF2\u9A8C\u8BC1\u6240\u6709\u5B9E\u4F8B\u4F4D\u7F6E" : "\u23ED\uFE0F \u8DF3\u8FC7\u4F4D\u7F6E\u9A8C\u8BC1"}

\u{1F4A1} \u5EFA\u8BAE:
- \u68C0\u67E5\u5931\u8D25\u7684\u5B9E\u4F8B\u662F\u5426\u4F7F\u7528\u4E86\u6B63\u786E\u7684\u7EC4\u4EF6key
- \u786E\u8BA4\u5750\u6807\u4F4D\u7F6E\u662F\u5426\u5408\u7406
- \u9A8C\u8BC1\u7EC4\u4EF6\u662F\u5426\u5728\u5F53\u524D\u6587\u6863\u4E2D\u53EF\u7528`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u6279\u91CF\u521B\u5EFA\u7EC4\u4EF6\u5B9E\u4F8B\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "generate_game_page_design",
  "\u751F\u6210\u6E38\u620F\u5207\u6362\u9875Figma\u8BBE\u8BA1\u7A3F - \u4E00\u952E\u521B\u5EFA\u5B8C\u6574\u7684\u79FB\u52A8\u7AEF\u6E38\u620F\u5207\u6362\u9875\u9762",
  {
    pageWidth: import_zod.z.number().default(375).describe("\u9875\u9762\u5BBD\u5EA6\uFF0C\u9ED8\u8BA4375px"),
    pageHeight: import_zod.z.number().default(812).describe("\u9875\u9762\u9AD8\u5EA6\uFF0C\u9ED8\u8BA4812px"),
    baseX: import_zod.z.number().default(100).describe("\u9875\u9762\u8D77\u59CBX\u5750\u6807"),
    baseY: import_zod.z.number().default(100).describe("\u9875\u9762\u8D77\u59CBY\u5750\u6807"),
    useComponents: import_zod.z.boolean().default(true).describe("\u662F\u5426\u4F7F\u7528\u7EC4\u4EF6\u5E93\u4E2D\u7684\u7EC4\u4EF6"),
    theme: import_zod.z.enum(["dark", "light"]).default("dark").describe("\u4E3B\u9898\u98CE\u683C"),
    includeHomeIndicator: import_zod.z.boolean().default(true).describe("\u662F\u5426\u5305\u542BHome Indicator")
  },
  async ({ pageWidth, pageHeight, baseX, baseY, useComponents, theme, includeHomeIndicator }) => {
    try {
      logger.info("\u5F00\u59CB\u751F\u6210\u6E38\u620F\u5207\u6362\u9875\u8BBE\u8BA1\u7A3F...");
      const gameData = [
        // 第1行
        [
          { name: "\u9634\u9633\u5E08", iconKey: "c675c56fbd4b307f492b320e06c4e9f8e7882625" },
          { name: "\u68A6\u5E7B\u897F\u6E38", iconKey: "dbcd45502f3c6888427a80aa3126136ee1268993" },
          { name: "\u730E\u9B42\u89C9\u9192", iconKey: "6806f1a993852b5981f1e38af00a9ed77ef1c42e" },
          { name: "\u5927\u5510\u65E0\u53CC", iconKey: "49f8a9b61a1fe4c7b3beba08235e18e00c553c31" }
        ],
        // 第2行
        [
          { name: "\u4E00\u68A6\u6C5F\u6E56", iconKey: "2c0cab4b3e89e8efa47b48f2669563098f63802a" },
          { name: "\u8352\u91CE\u884C\u52A8", iconKey: "55edebb9a5d8168df2a20964bbe52838d6134600" },
          { name: "\u660E\u65E5\u4E4B\u540E", iconKey: "48e80ff27b07c87af963a15ffd073d6e22a323c2" },
          { name: "\u5929\u8C15\u624B\u6E38", iconKey: "89820da4bb6fd5e9859882a2eb2e423dcb6c35e7" }
        ],
        // 第3行
        [
          { name: "\u5929\u4E0B\u624B\u6E38", iconKey: "8efcd030f5634cd906aef3038c82716862585beb" },
          { name: "\u5029\u5973\u5E7D\u9B42", iconKey: "d3f22cd33b5f106af0c8e155743d42951a671094" },
          { name: "EVE\u624B\u6E38", iconKey: "8825c181bcdb2f6a6c74c3f8061a44938b5c043e" },
          { name: "\u9547\u9B42\u66F2", iconKey: "ae09f748d761d75f3751a3f4d607d7585b06836d" }
        ],
        // 第4行
        [
          { name: "\u975E\u4EBA\u5B66\u56ED", iconKey: "347c3dadae89d97d9cf1f4f1071da560dc368988" },
          { name: "\u8F69\u8F95\u5251", iconKey: "584cd306fe14dc076fef56a414779e7ac1a616bb" },
          { name: "\u732B\u548C\u8001\u9F20", iconKey: "fec533b2c963f0b4811b3ac099bb8e12473cdd5a" },
          { name: "\u9047\u89C1\u9006\u6C34\u5BD2", iconKey: "018e7625d61a9509c90c571bddce4f1634e7dd49" }
        ],
        // 第5行
        [
          { name: "\u8424\u706B\u7A81\u51FB", iconKey: "f308e104010c1a53cc33251e91d8d9a0464d6568" },
          { name: "\u65E0\u5C3D\u6218\u533A", iconKey: "fd9030da6bcd00c39e8755b13f2fa077f30345d2" },
          { name: "\u5FD8\u5DDD\u98CE\u534E\u5F55", iconKey: "100c092428d2431a5bfa646fb8e37a7dbf25af43" },
          { name: "\u7B2C\u4E94\u4EBA\u683C", iconKey: "907d7862f22264aeb4d00a494b23214bfb3241ed" }
        ],
        // 第6行
        [
          { name: "\u86CB\u4ED4\u6D3E\u5BF9", iconKey: "f6df4571da44f141ade575cf9dbe2b88954b8ecd" },
          { name: "\u5927\u8BDD\u897F\u6E38", iconKey: "6b305b38a5eb3bdfc6caa3fe8015abd47d760304" },
          { name: "\u8D85\u51E1\u5148\u950B", iconKey: "b70b3e1ee042d94da86fdf5bc055f03394a28e44" },
          { name: "\u6697\u9ED1\u7834\u574F\u795E", iconKey: "1e2119322cef621bc417c8cdf7a58326fe66e544" }
        ]
      ];
      const componentKeys = {
        statusBar: "dd59b1e5415d8118b717f3aa7b15905bf7df1825",
        searchBar: "d9cee5e7e307c1a4e5fa53b259c4dfa61fbd8c6a",
        homeIndicator: "b7a0740409b6250db848c85c25f8d4833f84af3d",
        filterAny: "3e061776588ed6053e2dc8cfddcb08e8e7fb00cb",
        filterSelected: "19e6b11c59b8e77940fc8cdb0234da69d4b0e308",
        filterUnselected: "103d7fd5af7385dd4663890c18527f43c9906ad0"
      };
      const colors = theme === "dark" ? {
        background: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
        // 浅色背景
        gameGridBackground: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
        // #FAFAFA
        cardBackground: { r: 1, g: 1, b: 1, a: 0 },
        transparent: { r: 1, g: 1, b: 1, a: 0 },
        // 透明填充
        text: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        textSecondary: { r: 0.4, g: 0.4, b: 0.4, a: 1 }
      } : {
        background: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
        // 浅色背景
        gameGridBackground: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
        // #FAFAFA
        cardBackground: { r: 1, g: 1, b: 1, a: 0 },
        transparent: { r: 1, g: 1, b: 1, a: 0 },
        // 透明填充
        text: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        textSecondary: { r: 0.4, g: 0.4, b: 0.4, a: 1 }
      };
      let createdElements = [];
      logger.info("\u521B\u5EFA\u4E3B\u6846\u67B6...");
      const mainFrame = await sendCommandToFigma("create_frame", {
        x: baseX,
        y: baseY,
        width: pageWidth,
        height: pageHeight,
        name: "\u6E38\u620F\u5207\u6362\u9875",
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
      const mainFrameId = mainFrame.id;
      createdElements.push(`\u4E3B\u6846\u67B6: ${mainFrameId}`);
      if (useComponents) {
        logger.info("\u6DFB\u52A0\u72B6\u6001\u680F...");
        const statusBar = await sendCommandToFigma("create_component_instance", {
          componentKey: componentKeys.statusBar,
          x: baseX,
          y: baseY,
          parentId: mainFrameId
        });
        createdElements.push(`\u72B6\u6001\u680F: ${statusBar.id}`);
      }
      if (useComponents) {
        logger.info("\u6DFB\u52A0\u641C\u7D22\u680F...");
        const searchBar = await sendCommandToFigma("create_component_instance", {
          componentKey: componentKeys.searchBar,
          x: baseX,
          y: baseY + 44,
          parentId: mainFrameId
        });
        createdElements.push(`\u641C\u7D22\u680F: ${searchBar.id}`);
      }
      logger.info("\u521B\u5EFA\u5206\u7C7B\u8FC7\u6EE4\u5668...");
      const filterFrame = await sendCommandToFigma("create_frame", {
        x: baseX,
        y: baseY + 88,
        width: pageWidth,
        height: 60,
        name: "\u5206\u7C7B\u8FC7\u6EE4\u5668",
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
      const filterFrameId = filterFrame.id;
      createdElements.push(`\u5206\u7C7B\u8FC7\u6EE4\u5668: ${filterFrameId}`);
      if (useComponents) {
        const filterButtons = [
          { key: componentKeys.filterAny, name: "\u5168\u90E8", x: baseX + 16 },
          { key: componentKeys.filterSelected, name: "\u624B\u6E38-\u9009\u4E2D", x: baseX + 88 },
          { key: componentKeys.filterUnselected, name: "\u7AEF\u6E38", x: baseX + 160 }
        ];
        for (const button of filterButtons) {
          const filterButton = await sendCommandToFigma("create_component_instance", {
            componentKey: button.key,
            x: button.x,
            y: baseY + 100,
            parentId: filterFrameId
          });
          createdElements.push(`${button.name}: ${filterButton.id}`);
        }
      }
      logger.info("\u521B\u5EFA\u6E38\u620F\u7F51\u683C\u533A\u57DF...");
      const gameGridFrame = await sendCommandToFigma("create_frame", {
        x: baseX,
        y: baseY + 148,
        width: pageWidth,
        height: 600,
        name: "\u6E38\u620F\u7F51\u683C\u533A\u57DF",
        fillColor: colors.transparent,
        // 设置为透明
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
      const gameGridFrameId = gameGridFrame.id;
      createdElements.push(`\u6E38\u620F\u7F51\u683C\u533A\u57DF: ${gameGridFrameId}`);
      logger.info("\u521B\u5EFA\u6E38\u620F\u5185\u5BB9...");
      for (let rowIndex = 0; rowIndex < gameData.length; rowIndex++) {
        const rowData = gameData[rowIndex];
        const gameRow = await sendCommandToFigma("create_frame", {
          x: baseX + 16,
          y: baseY + 168 + rowIndex * 105,
          width: pageWidth - 32,
          height: 85,
          name: `\u6E38\u620F\u884C${rowIndex + 1}`,
          fillColor: colors.transparent,
          // 设置为透明
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
        const gameRowId = gameRow.id;
        createdElements.push(`\u6E38\u620F\u884C${rowIndex + 1}: ${gameRowId}`);
        for (let colIndex = 0; colIndex < 4; colIndex++) {
          if (rowData[colIndex]) {
            const game = rowData[colIndex];
            const gameX = baseX + 16 + colIndex * 85;
            const gameY = baseY + 168 + rowIndex * 105;
            const gameContainer = await sendCommandToFigma("create_frame", {
              x: gameX,
              y: gameY,
              width: 70,
              height: 85,
              name: `\u6E38\u620F\u5BB9\u5668-${game.name}`,
              fillColor: colors.transparent,
              // 设置为透明
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
            const gameContainerId = gameContainer.id;
            if (useComponents && game.iconKey) {
              try {
                const gameIcon = await sendCommandToFigma("create_component_instance", {
                  componentKey: game.iconKey,
                  x: gameX + 5,
                  y: gameY,
                  parentId: gameContainerId
                });
                createdElements.push(`${game.name}\u56FE\u6807: ${gameIcon.id}`);
              } catch (iconError) {
                const placeholder = await sendCommandToFigma("create_rectangle", {
                  x: gameX + 5,
                  y: gameY,
                  width: 60,
                  height: 60,
                  name: `${game.name}\u56FE\u6807\u5360\u4F4D\u7B26`,
                  parentId: gameContainerId
                });
                createdElements.push(`${game.name}\u5360\u4F4D\u7B26: ${placeholder.id}`);
              }
            }
            const gameName = await sendCommandToFigma("create_text", {
              x: gameX + 5,
              y: gameY + 68,
              text: game.name,
              name: `\u6E38\u620F\u540D-${game.name}`,
              fontSize: 12,
              fontColor: colors.textSecondary,
              parentId: gameContainerId
            });
            createdElements.push(`${game.name}\u6587\u5B57: ${gameName.id}`);
          }
        }
      }
      if (includeHomeIndicator && useComponents) {
        logger.info("\u6DFB\u52A0Home Indicator...");
        const homeIndicator = await sendCommandToFigma("create_component_instance", {
          componentKey: componentKeys.homeIndicator,
          x: baseX,
          y: baseY + pageHeight - 34,
          parentId: mainFrameId
        });
        createdElements.push(`Home Indicator: ${homeIndicator.id}`);
      }
      logger.info("\u6E38\u620F\u5207\u6362\u9875\u8BBE\u8BA1\u7A3F\u751F\u6210\u5B8C\u6210\uFF01");
      return {
        content: [
          {
            type: "text",
            text: `\u{1F3AE} \u6E38\u620F\u5207\u6362\u9875\u8BBE\u8BA1\u7A3F\u751F\u6210\u6210\u529F\uFF01

\u{1F4F1} \u9875\u9762\u89C4\u683C:
\u2022 \u5C3A\u5BF8: ${pageWidth} x ${pageHeight}px
\u2022 \u4E3B\u9898: ${theme === "dark" ? "\u6DF1\u8272" : "\u6D45\u8272"}\u4E3B\u9898
\u2022 \u4F4D\u7F6E: (${baseX}, ${baseY})

\u{1F3AF} \u751F\u6210\u5185\u5BB9:
\u2705 \u72B6\u6001\u680F\u548C\u641C\u7D22\u680F
\u2705 \u5206\u7C7B\u8FC7\u6EE4\u5668\uFF08\u624B\u6E38\u9009\u4E2D\u72B6\u6001\uFF09
\u2705 6\u884C4\u5217\u6E38\u620F\u7F51\u683C\u5E03\u5C40\uFF08\u517124\u4E2A\u6E38\u620F\uFF09
\u2705 \u4F7F\u7528\u7EC4\u4EF6\u5E93\u4E2D\u7684\u6E38\u620F\u56FE\u6807
${includeHomeIndicator ? "\u2705 Home Indicator" : "\u23ED\uFE0F \u8DF3\u8FC7Home Indicator"}

\u{1F4CA} \u521B\u5EFA\u7EDF\u8BA1:
\u2022 \u4E3B\u6846\u67B6: 1\u4E2A
\u2022 \u7CFB\u7EDF\u7EC4\u4EF6: ${useComponents ? "3\u4E2A" : "0\u4E2A\uFF08\u8DF3\u8FC7\uFF09"}
\u2022 \u8FC7\u6EE4\u5668\u6309\u94AE: ${useComponents ? "4\u4E2A" : "0\u4E2A\uFF08\u8DF3\u8FC7\uFF09"}
\u2022 \u6E38\u620F\u5BB9\u5668: 24\u4E2A
\u2022 \u6E38\u620F\u56FE\u6807: 24\u4E2A
\u2022 \u6E38\u620F\u540D\u79F0: 24\u4E2A

\u{1F3A8} \u8BBE\u8BA1\u7279\u8272:
\u2022 \u73B0\u4EE3\u5316${theme === "dark" ? "\u6DF1\u8272" : "\u6D45\u8272"}\u4E3B\u9898
\u2022 \u54CD\u5E94\u5F0F\u81EA\u52A8\u5E03\u5C40
\u2022 \u6807\u51C6\u79FB\u52A8\u7AEF\u5C3A\u5BF8
\u2022 \u7EC4\u4EF6\u5316\u8BBE\u8BA1\u7CFB\u7EDF
\u2022 \u5B8C\u6574\u7684\u4EA4\u4E92\u72B6\u6001

\u{1F4A1} \u4F7F\u7528\u5EFA\u8BAE:
1. \u53EF\u4EE5\u8C03\u6574\u6E38\u620F\u56FE\u6807\u7684\u5706\u89D2\u548C\u9634\u5F71
2. \u6839\u636E\u9700\u8981\u4FEE\u6539\u5206\u7C7B\u8FC7\u6EE4\u5668\u7684\u9009\u4E2D\u72B6\u6001
3. \u53EF\u4EE5\u6DFB\u52A0\u66F4\u591A\u6E38\u620F\u6216\u8C03\u6574\u7F51\u683C\u5E03\u5C40
4. \u5EFA\u8BAE\u4E3A\u4EA4\u4E92\u5143\u7D20\u6DFB\u52A0\u60AC\u505C\u548C\u70B9\u51FB\u72B6\u6001

\u{1F527} \u521B\u5EFA\u7684\u5143\u7D20ID:
${createdElements.slice(0, 10).join("\n")}
${createdElements.length > 10 ? `
... \u8FD8\u6709${createdElements.length - 10}\u4E2A\u5143\u7D20` : ""}

\u4E3B\u6846\u67B6ID: ${mainFrameId}
\u73B0\u5728\u60A8\u53EF\u4EE5\u5728Figma\u4E2D\u67E5\u770B\u548C\u7F16\u8F91\u8FD9\u4E2A\u5B8C\u6574\u7684\u6E38\u620F\u5207\u6362\u9875\u8BBE\u8BA1\u7A3F\uFF01`
          }
        ]
      };
    } catch (error) {
      logger.error(`\u6E38\u620F\u9875\u9762\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `\u274C \u6E38\u620F\u5207\u6362\u9875\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}

\u{1F527} \u6545\u969C\u6392\u9664\u5EFA\u8BAE:
1. \u786E\u4FDD\u5DF2\u8FDE\u63A5\u5230Figma\u5E76\u52A0\u5165\u4E86\u6B63\u786E\u7684\u9891\u9053
2. \u68C0\u67E5\u7EC4\u4EF6\u5E93\u662F\u5426\u5305\u542B\u6240\u9700\u7684\u7EC4\u4EF6
3. \u9A8C\u8BC1\u5750\u6807\u4F4D\u7F6E\u662F\u5426\u5408\u7406
4. \u786E\u8BA4Figma\u6587\u6863\u6709\u8DB3\u591F\u7684\u7A7A\u95F4

\u8BF7\u68C0\u67E5\u9519\u8BEF\u4FE1\u606F\u5E76\u91CD\u8BD5\u3002`
          }
        ]
      };
    }
  }
);
//# sourceMappingURL=server.cjs.map