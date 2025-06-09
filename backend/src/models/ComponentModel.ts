import mongoose from '../db/mongo';

const ComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'Button' },
  description: { type: String },
  figmaComponent: { type: Object },
  aiPrompt: { type: String },
  aiConfig: { type: Object },
  props: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const ComponentModel = mongoose.model('Component', ComponentSchema); 