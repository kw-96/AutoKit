import { Router } from 'express';
import { getMcpConfigs } from '../models/mcpConfig';
import { getFigmaComponents } from '../services/figma';

const router = Router();

/**
 * @swagger
 * /api/figma/components:
 *   post:
 *     summary: 拉取Figma组件库
 *     tags: [Figma]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileKey:
 *                 type: string
 *                 description: Figma文件ID
 *                 example: "xxxxxx"
 *               mcpConfigId:
 *                 type: string
 *                 description: MCP配置ID（可选，默认取第一个FigmaMCP）
 *     responses:
 *       200:
 *         description: 组件列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.post('/components', async (req, res) => {
  const { fileKey, mcpConfigId } = req.body;
  if (!fileKey) return res.status(400).json({ success: false, msg: '缺少fileKey' });
  // 获取APIKey
  const configs = getMcpConfigs();
  let config = configs.find(c => c.id === mcpConfigId && c.type === 'FigmaMCP');
  if (!config) config = configs.find(c => c.type === 'FigmaMCP');
  if (!config) return res.status(400).json({ success: false, msg: '未找到FigmaMCP配置' });
  try {
    const data = await getFigmaComponents(fileKey, config.apiKey);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, msg: e.message });
  }
});

export default router;
