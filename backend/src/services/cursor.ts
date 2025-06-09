import { McpConfig } from '../models/mcpConfig';

export interface CursorCompletionRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
}

export interface CursorCompletionResponse {
  completion: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class CursorMcpService {
  private config: McpConfig;

  constructor(config: McpConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 模拟连接测试，实际应该调用 Cursor API
      const endpoint = this.config.cursorConfig?.endpoint || 'https://api.cursor.sh/v1';
      const response = await fetch(`${endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Cursor MCP connection test failed:', error);
      return false;
    }
  }

  async generateCompletion(request: CursorCompletionRequest): Promise<CursorCompletionResponse> {
    const endpoint = this.config.cursorConfig?.endpoint || 'https://api.cursor.sh/v1';
    const defaultConfig = this.config.cursorConfig || {};
    
    const payload = {
      prompt: request.prompt,
      temperature: request.temperature || defaultConfig.temperature || 0.7,
      max_tokens: request.maxTokens || defaultConfig.maxTokens || 1024,
      top_p: request.topP || defaultConfig.topP || 0.9,
      model: request.model || defaultConfig.model || 'cursor-small'
    };

    const response = await fetch(`${endpoint}/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Cursor API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async generateCode(prompt: string, language: string = 'typescript'): Promise<string> {
    const enhancedPrompt = `Generate ${language} code for the following requirement:\n\n${prompt}\n\nCode:`;
    
    const response = await this.generateCompletion({
      prompt: enhancedPrompt,
      temperature: 0.3, // 降低温度以获得更准确的代码
      maxTokens: this.config.cursorConfig?.maxTokens || 1024
    });

    return response.completion;
  }

  async generateDesignSpec(designDescription: string): Promise<string> {
    const prompt = `Generate a detailed design specification JSON for the following design description:\n\n${designDescription}\n\nDesign Spec JSON:`;
    
    const response = await this.generateCompletion({
      prompt,
      temperature: 0.5,
      maxTokens: this.config.cursorConfig?.maxTokens || 1024
    });

    return response.completion;
  }
}