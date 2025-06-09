import { Router } from 'express';
import Joi from 'joi';
import { validateBody } from '../middleware/validate';
import { getFigmaFile } from '../services/figma';
import { DesignSystemModel } from '../models/DesignSystemModel';

const router = Router();

const designSystemSchema = Joi.object({
  figmaLibraryId: Joi.string().min(4).required(),
  apiKey: Joi.string().min(8).required()
});

/**
 * @swagger
 * tags:
 *   name: 设计规范系统
 *   description: 设计规范JSON生成相关API
 */

/**
 * @swagger
 * /api/design-system:
 *   post:
 *     summary: 生成设计规范JSON
 *     tags: [设计规范系统]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               figmaLibraryId:
 *                 type: string
 *                 description: Figma组件库ID
 *                 example: "figma-xxxx"
 *               apiKey:
 *                 type: string
 *                 description: Figma API Key
 *                 example: "xxxx-xxxx"
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
 *                   $ref: '#/components/schemas/DesignSystem'
 */
router.post('/', validateBody(designSystemSchema), async (req, res) => {
  const { figmaLibraryId, apiKey } = req.body;
  try {
    const fileData = await getFigmaFile(figmaLibraryId, apiKey) as any;
    // 简单提取颜色、字体、间距等设计规范（实际可根据Figma结构优化）
    const styles = fileData.styles || {};
    const colors = Object.values(styles).filter((s: any) => s.style_type === 'FILL');
    const fonts = Object.values(styles).filter((s: any) => s.style_type === 'TEXT');
    // 间距等可根据实际Figma结构扩展
    const designSystem = {
      libraryId: figmaLibraryId,
      colors,
      fonts,
      spacing: [4, 8, 16, 24, 32],
      generatedAt: new Date().toISOString()
    };
    // 持久化到MongoDB
    const saved = await DesignSystemModel.create(designSystem);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Figma API请求失败' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     DesignSystem:
 *       type: object
 *       properties:
 *         libraryId:
 *           type: string
 *         colors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: string
 *         fonts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               family:
 *                 type: string
 *               size:
 *                 type: number
 *         spacing:
 *           type: array
 *           items:
 *             type: number
 *         generatedAt:
 *           type: string
 *           format: date-time
 */

export default router; 