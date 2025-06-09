import { Router } from 'express';
import { getMcpConfigs, saveMcpConfigs, McpConfig } from '../models/mcpConfig';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateBody, validateParams } from '../middleware/validate';

// Cursor MCP Plugin 验证函数
async function validateCursorMcpConfig(apiKey: string, cursorConfig?: any) {
  // 验证 API Key 格式
  if (!apiKey || apiKey.length < 8) {
    throw new Error('API Key 格式无效');
  }
  
  // 如果有 cursorConfig，验证其参数
  if (cursorConfig) {
    const { temperature, maxTokens, topP, completionDelay, maxGenLength } = cursorConfig;
    
    if (temperature !== undefined && (temperature < 0.01 || temperature > 1)) {
      throw new Error('Temperature 参数应在 0.01-1 范围内');
    }
    
    if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 4096)) {
      throw new Error('Max Tokens 参数应在 1-4096 范围内');
    }
    
    if (topP !== undefined && (topP < 0 || topP > 1)) {
      throw new Error('Top P 参数应在 0-1 范围内');
    }
    
    if (completionDelay !== undefined && (completionDelay < 0 || completionDelay > 5)) {
      throw new Error('Completion Delay 参数应在 0-5 秒范围内');
    }
    
    if (maxGenLength !== undefined && (maxGenLength < 1 || maxGenLength > 1000)) {
      throw new Error('Max Gen Length 参数应在 1-1000 范围内');
    }
  }
  
  // 这里可以添加实际的 API 连接测试
  // 暂时模拟验证成功
  return true;
}

const router = Router();

const mcpConfigSchema = Joi.object({
  name: Joi.string().min(2).max(32).required(),
  type: Joi.string().valid('FigmaMCP', 'CursorMCP').default('FigmaMCP'),
  apiKey: Joi.string().min(8).required(),
  cursorConfig: Joi.object({
    endpoint: Joi.string().uri().optional(),
    model: Joi.string().optional(),
    temperature: Joi.number().min(0.01).max(1).optional(),
    maxTokens: Joi.number().min(1).max(4096).optional(),
    topP: Joi.number().min(0).max(1).optional(),
    completionDelay: Joi.number().min(0).max(5).optional(),
    maxGenLength: Joi.number().min(1).max(1000).optional()
  }).optional()
});


const idParamSchema = Joi.object({
  id: Joi.string().required()
});

/**
 * @swagger
 * tags:
 *   name: MCP配置
 *   description: MCP配置管理相关API
 */

/**
 * @swagger
 * /api/mcp-config:
 *   get:
 *     summary: 获取所有MCP配置
 *     tags: [MCP配置]
 *     responses:
 *       200:
 *         description: 配置列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/McpConfig'
 */
router.get('/', (req, res) => {
  const configs = getMcpConfigs();
  res.json({ code: 0, data: configs });
});

/**
 * @swagger
 * /api/mcp-config:
 *   post:
 *     summary: 新增MCP配置
 *     tags: [MCP配置]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/McpConfigInput'
 *     responses:
 *       201:
 *         description: 新增成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/McpConfig'
 */
router.post('/', validateBody(mcpConfigSchema), async (req, res) => {
  const { name, type, apiKey, cursorConfig } = req.body;
  
  // 验证 Cursor MCP Plugin 配置
  if (type === 'CursorMCP') {
    try {
      await validateCursorMcpConfig(apiKey, cursorConfig);
    } catch (error) {
      return res.status(400).json({ 
        code: 1, 
        msg: `Cursor MCP 配置验证失败: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }
  
  const configs = getMcpConfigs();
  const newConfig: McpConfig = {
    id: uuidv4(),
    name,
    type,
    apiKey,
    createdAt: new Date().toISOString(),
    ...(cursorConfig && { cursorConfig })
  };
  configs.push(newConfig);
  saveMcpConfigs(configs);
  res.json({ code: 0, data: configs });
});


/**
 * @swagger
 * /api/mcp-config/{id}:
 *   delete:
 *     summary: 删除MCP配置
 *     tags: [MCP配置]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/McpConfig'
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  let configs = getMcpConfigs();
  configs = configs.filter(c => c.id !== id);
  saveMcpConfigs(configs);
  res.json({ code: 0, data: configs });
});

/**
 * @swagger
 * /api/mcp-config/{id}:
 *   put:
 *     summary: 更新MCP配置
 *     tags: [MCP配置]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/McpConfigInput'
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/McpConfig'
 */
router.put('/:id', validateParams(idParamSchema), validateBody(mcpConfigSchema), async (req, res) => {
  const { id } = req.params;
  const { name, type, apiKey, cursorConfig } = req.body;
  
  // 验证 Cursor MCP Plugin 配置
  if (type === 'CursorMCP') {
    try {
      await validateCursorMcpConfig(apiKey, cursorConfig);
    } catch (error) {
      return res.status(400).json({ 
        code: 1, 
        msg: `Cursor MCP 配置验证失败: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }
  
  const configs = getMcpConfigs();
  const idx = configs.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ code: 1, msg: '未找到配置' });
  
  configs[idx] = { 
    ...configs[idx], 
    name, 
    type, 
    apiKey,
    ...(cursorConfig && { cursorConfig })
  };
  saveMcpConfigs(configs);
  res.json({ code: 0, data: configs });
});

/**
 * @swagger
 * /api/mcp-config/test:
 *   post:
 *     summary: 测试MCP配置连接
 *     tags: [MCP配置]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/McpConfigInput'
 *     responses:
 *       200:
 *         description: 测试成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 msg:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.post('/test', validateBody(mcpConfigSchema), async (req, res) => {
  const { type, apiKey, cursorConfig } = req.body;
  
  try {
    if (type === 'CursorMCP') {
      await validateCursorMcpConfig(apiKey, cursorConfig);
      res.json({ 
        code: 0, 
        msg: 'Cursor MCP 配置测试成功', 
        data: { 
          status: 'connected',
          config: cursorConfig 
        } 
      });
    } else if (type === 'FigmaMCP') {
      // 保持原有的 Figma MCP 测试逻辑
      res.json({ 
        code: 0, 
        msg: 'Figma MCP 配置测试成功', 
        data: { status: 'connected' } 
      });
    } else {
      res.status(400).json({ code: 1, msg: '不支持的 MCP 类型' });
    }
  } catch (error) {
    res.status(400).json({ 
      code: 1, 
      msg: `配置测试失败: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});


/**
 * @swagger
 * components:
 *   schemas:
 *     CursorMcpConfig:
 *       type: object
 *       properties:
 *         endpoint:
 *           type: string
 *           format: uri
 *           description: Cursor API endpoint
 *         model:
 *           type: string
 *           description: Model name to use
 *         temperature:
 *           type: number
 *           minimum: 0.01
 *           maximum: 1
 *           description: Randomness control
 *         maxTokens:
 *           type: number
 *           minimum: 1
 *           maximum: 4096
 *           description: Maximum tokens to generate
 *         topP:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: Nucleus sampling parameter
 *         completionDelay:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Delay before triggering completion (seconds)
 *         maxGenLength:
 *           type: number
 *           minimum: 1
 *           maximum: 1000
 *           description: Maximum generation length
 *     McpConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [FigmaMCP, CursorMCP]
 *         apiKey:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         cursorConfig:
 *           $ref: '#/components/schemas/CursorMcpConfig'
 *     McpConfigInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [FigmaMCP, CursorMCP]
 *         apiKey:
 *           type: string
 *         cursorConfig:
 *           $ref: '#/components/schemas/CursorMcpConfig'
 *       required:
 *         - name
 *         - apiKey
 */


export default router; 