import { Router } from 'express';
import Joi from 'joi';
import { validateBody } from '../middleware/validate';
import { getFigmaComponents } from '../services/figma';
import { ComponentModel } from '../models/ComponentModel';

const router = Router();

const componentSchema = Joi.object({
  name: Joi.string().min(2).max(32).required(),
  type: Joi.string().valid('Button', 'Input', 'Alert').default('Button'),
  description: Joi.string().allow('').max(128),
  figmaLibraryId: Joi.string().min(4),
  apiKey: Joi.string().min(8),
  aiPrompt: Joi.string().allow(''),
  aiConfig: Joi.object().optional()
});

/**
 * @swagger
 * tags:
 *   name: 组件生成
 *   description: 组件生成相关API（AI能力由Cursor侧实现，后端仅做数据中转与聚合）
 */

/**
 * @swagger
 * /api/component:
 *   post:
 *     summary: 生成新组件
 *     tags: [组件生成]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 组件名称
 *                 example: "MyButton"
 *               type:
 *                 type: string
 *                 enum: [Button, Input, Alert]
 *                 description: 组件类型
 *                 example: "Button"
 *               description:
 *                 type: string
 *                 description: 组件描述
 *                 example: "自定义按钮组件"
 *               figmaLibraryId:
 *                 type: string
 *                 description: Figma组件库ID（可选）
 *                 example: "figma-xxxx"
 *               apiKey:
 *                 type: string
 *                 description: Figma API Key（可选）
 *                 example: "xxxx-xxxx"
 *               aiPrompt:
 *                 type: string
 *                 description: AI生成提示词（由Cursor侧传递，后端不处理）
 *                 example: "生成一个自定义按钮组件"
 *               aiConfig:
 *                 type: object
 *                 description: AI相关配置（由Cursor侧传递，后端不处理）
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
 *                   $ref: '#/components/schemas/ComponentGenResult'
 */
router.post('/', validateBody(componentSchema), async (req, res) => {
  const { name, type, description, figmaLibraryId, apiKey, aiPrompt, aiConfig } = req.body;
  try {
    let figmaComponent: any = null;
    if (figmaLibraryId && apiKey) {
      const compData = await getFigmaComponents(figmaLibraryId, apiKey) as any;
      const comps = compData.meta?.components || [];
      figmaComponent = comps.find((c: any) => c.name === name || c.name.includes(name));
    }
    const component = {
      name,
      type: type || 'Button',
      description,
      figmaComponent,
      aiPrompt,
      aiConfig,
      props: [
        { name: 'size', type: 'string', default: 'medium' },
        { name: 'color', type: 'string', default: 'primary' }
      ],
      createdAt: new Date().toISOString()
    };
    // 持久化到MongoDB
    const saved = await ComponentModel.create(component);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Figma API请求失败' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ComponentGenResult:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [Button, Input, Alert]
 *         description:
 *           type: string
 *         figmaComponent:
 *           type: object
 *           description: Figma组件详细信息
 *         aiPrompt:
 *           type: string
 *           description: AI生成提示词（由Cursor侧传递，后端不处理）
 *         aiConfig:
 *           type: object
 *           description: AI相关配置（由Cursor侧传递，后端不处理）
 *         props:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               default:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

export default router; 