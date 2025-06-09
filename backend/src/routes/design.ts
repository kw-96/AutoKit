import { Router } from 'express';
import Joi from 'joi';
import { validateBody } from '../middleware/validate';
import { getFigmaFile } from '../services/figma';
import { DesignGenModel } from '../models/DesignGenModel';

const router = Router();

const designSchema = Joi.object({
  pageName: Joi.string().min(2).max(32).required(),
  description: Joi.string().allow('').max(128),
  components: Joi.array().items(Joi.string().min(1)).default([]),
  figmaLibraryId: Joi.string().min(4),
  apiKey: Joi.string().min(8),
  aiPrompt: Joi.string().allow(''),
  aiConfig: Joi.object().optional()
});

/**
 * @swagger
 * tags:
 *   name: 设计稿生成
 *   description: 设计稿生成相关API（AI能力由Cursor侧实现，后端仅做数据中转与聚合）
 */

/**
 * @swagger
 * /api/design:
 *   post:
 *     summary: 生成设计稿
 *     tags: [设计稿生成]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pageName:
 *                 type: string
 *                 description: 页面名称
 *                 example: "登录页"
 *               description:
 *                 type: string
 *                 description: 页面描述
 *                 example: "包含Logo、表单、按钮"
 *               components:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 组件列表
 *                 example: ["Input", "Button"]
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
 *                 example: "生成一个包含Logo和表单的登录页"
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
 *                   $ref: '#/components/schemas/DesignGenResult'
 */
router.post('/', validateBody(designSchema), async (req, res) => {
  const { pageName, description, components, figmaLibraryId, apiKey, aiPrompt, aiConfig } = req.body;
  try {
    let figmaPage: any = null;
    if (figmaLibraryId && apiKey) {
      const fileData = await getFigmaFile(figmaLibraryId, apiKey) as any;
      const document = fileData.document;
      if (document && document.children) {
        figmaPage = document.children.find((node: any) => node.name === pageName || node.name.includes(pageName));
      }
    }
    const design = {
      pageName,
      description,
      components,
      figmaPage,
      aiPrompt,
      aiConfig,
      figmaUrl: figmaLibraryId ? `https://www.figma.com/file/${figmaLibraryId}` : '',
      preview: 'https://via.placeholder.com/400x300?text=Figma+Design',
      createdAt: new Date().toISOString()
    };
    // 持久化到MongoDB
    const saved = await DesignGenModel.create(design);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Figma API请求失败' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     DesignGenResult:
 *       type: object
 *       properties:
 *         pageName:
 *           type: string
 *         description:
 *           type: string
 *         components:
 *           type: array
 *           items:
 *             type: string
 *         figmaPage:
 *           type: object
 *           description: Figma页面节点详细信息
 *         aiPrompt:
 *           type: string
 *           description: AI生成提示词（由Cursor侧传递，后端不处理）
 *         aiConfig:
 *           type: object
 *           description: AI相关配置（由Cursor侧传递，后端不处理）
 *         figmaUrl:
 *           type: string
 *         preview:
 *           type: string
 *           format: uri
 *         createdAt:
 *           type: string
 *           format: date-time
 */

export default router; 