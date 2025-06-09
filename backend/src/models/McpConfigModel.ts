import mongoose from '../db/mongo';

const McpConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'FigmaMCP' },
  apiKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const McpConfigModel = mongoose.model('McpConfig', McpConfigSchema); 