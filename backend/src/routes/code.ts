import { Router } from 'express';
import { getMcpConfigs } from '../models/mcpConfig';
import { CursorMcpService } from '../services/cursor';
import Joi from 'joi';
import { validateBody } from '../middleware/validate';

const router = Router();

const codeGenerateSchema = Joi.object({
  prompt: Joi.string().required(),
  language: Joi.string().default('typescript'),
  mcpConfigId: Joi.string().required()
});

const designSpecSchema = Joi.object({
  designDescription: Joi.string().required(),
  mcpConfigId: Joi.string().required()
});

const codeSchema = Joi.object({
  componentName: Joi.string().min(2).max(32).required(),
  props: Joi.array().items(Joi.string().min(1)).default([]),
  framework: Joi.string().valid('react', 'vue').default('react'),
  aiPrompt: Joi.string().allow(''),
  aiConfig: Joi.object().optional()
});

/**
 * @swagger
 * tags:
 *   name: 代码生成
 *   description: 代码生成相关API
 */

/**
 * @swagger
 * /api/code/generate:
 *   post:
 *     summary: 使用 Cursor MCP Plugin 生成代码
 *     tags: [代码生成]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 代码生成需求描述
 *               language:
 *                 type: string
 *                 description: 编程语言
 *                 default: typescript
 *               mcpConfigId:
 *                 type: string
 *                 description: 使用的 Cursor MCP 配置ID
 *             required:
 *               - prompt
 *               - mcpConfigId
 *     responses:
 *       200:
 *         description: 代码生成成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: MCP配置不存在
 */
router.post('/generate', validateBody(codeGenerateSchema), async (req, res) => {
  try {
    const { prompt, language, mcpConfigId } = req.body;
    
    // 获取 MCP 配置
    const configs = getMcpConfigs();
    const config = configs.find(c => c.id === mcpConfigId && c.type === 'CursorMCP');
    
    if (!config) {
      return res.status(404).json({ 
        code: 1, 
        msg: '未找到指定的 Cursor MCP 配置' 
      });
    }
    
    // 创建 Cursor MCP 服务实例
    const cursorService = new CursorMcpService(config);
    
    // 生成代码
    const generatedCode = await cursorService.generateCode(prompt, language);
    
    res.json({ 
      code: 0, 
      data: { 
        generatedCode, 
        language, 
        prompt,
        configUsed: {
          name: config.name,
          type: config.type
        }
      } 
    });
    
  } catch (error) {
    console.error('Code generation failed:', error);
    res.status(500).json({ 
      code: 1, 
      msg: `代码生成失败: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

/**
 * @swagger
 * /api/code/design-spec:
 *   post:
 *     summary: 使用 Cursor MCP Plugin 生成设计规范
 *     tags: [代码生成]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               designDescription:
 *                 type: string
 *                 description: 设计需求描述
 *               mcpConfigId:
 *                 type: string
 *                 description: 使用的 Cursor MCP 配置ID
 *             required:
 *               - designDescription
 *               - mcpConfigId
 *     responses:
 *       200:
 *         description: 设计规范生成成功
 */
router.post('/design-spec', validateBody(designSpecSchema), async (req, res) => {
  try {
    const { designDescription, mcpConfigId } = req.body;
    
    // 获取 MCP 配置
    const configs = getMcpConfigs();
    const config = configs.find(c => c.id === mcpConfigId && c.type === 'CursorMCP');
    
    if (!config) {
      return res.status(404).json({ 
        code: 1, 
        msg: '未找到指定的 Cursor MCP 配置' 
      });
    }
    
    // 创建 Cursor MCP 服务实例
    const cursorService = new CursorMcpService(config);
    
    // 生成设计规范
    const designSpec = await cursorService.generateDesignSpec(designDescription);
    
    res.json({ 
      code: 0, 
      data: { 
        designSpec, 
        designDescription,
        configUsed: {
          name: config.name,
          type: config.type
        }
      } 
    });
    
  } catch (error) {
    console.error('Design spec generation failed:', error);
    res.status(500).json({ 
      code: 1, 
      msg: `设计规范生成失败: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

/**
 * @swagger
 * /api/code:
 *   post:
 *     summary: 生成前端组件代码（原有功能）
 *     tags: [代码生成]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               componentName:
 *                 type: string
 *                 description: 组件名
 *                 example: "MyButton"
 *               props:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 组件props列表
 *                 example: ["label", "type"]
 *               framework:
 *                 type: string
 *                 enum: [react, vue]
 *                 description: 前端框架
 *                 example: "react"
 *               aiPrompt:
 *                 type: string
 *                 description: AI生成提示词
 *                 example: "生成一个带有label和type属性的按钮组件"
 *               aiConfig:
 *                 type: object
 *                 description: AI相关配置
 *     responses:
 *       200:
 *         description: 生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CodeGenResult'
 */
router.post('/', validateBody(codeSchema), (req, res) => {
  const { componentName, props, framework, aiPrompt, aiConfig } = req.body;
  // 原有的简单代码生成逻辑
  let code = '';
  if (framework === 'vue') {
    code = `<template>\n  <button :class=['btn', type]>{{ label }}</button>\n</template>\n<script setup>\nconst props = defineProps({ label: String, type: String })\n<\/script>`;
  } else {
    code = `import React from 'react';\n\nexport default function ${componentName}({ label, type }) {\n  return <button className={type}>{label}</button>;\n}`;
  }
  res.json({ success: true, data: { framework: framework || 'react', code, aiPrompt, aiConfig, generatedAt: new Date().toISOString() } });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     CodeGenResult:
 *       type: object
 *       properties:
 *         framework:
 *           type: string
 *           enum: [react, vue]
 *         code:
 *           type: string
 *         aiPrompt:
 *           type: string
 *           description: AI生成提示词
 *         aiConfig:
 *           type: object
 *           description: AI相关配置
 *         generatedAt:
 *           type: string
 *           format: date-time
 */

export default router;