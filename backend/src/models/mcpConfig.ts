import fs from 'fs';
import path from 'path';

export interface McpConfig {
  id: string;
  name: string;
  type: string; // 如FigmaMCP、CursorMCP等
  apiKey: string;
  createdAt: string;
  // Cursor MCP Plugin 特定配置
  cursorConfig?: {
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    completionDelay?: number;
    maxGenLength?: number;
  };
}

const CONFIG_FILE = path.resolve(__dirname, '../../config/mcp-config.json');

function loadFromFile(): McpConfig[] {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw) as McpConfig[];
    } catch {
      return [];
    }
  }
  return [];
}

function saveToFile(configs: McpConfig[]) {
  // 自动创建目录
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf-8');
}

let mcpConfigs: McpConfig[] = loadFromFile();

export function getMcpConfigs() {
  return mcpConfigs;
}

export function saveMcpConfigs(configs: McpConfig[]) {
  mcpConfigs = configs;
  saveToFile(mcpConfigs);
} 