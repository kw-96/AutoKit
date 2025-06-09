import mongoose from '../db/mongo';

const DesignGenSchema = new mongoose.Schema({
  pageName: { type: String, required: true },
  description: { type: String },
  components: { type: Array, default: [] },
  figmaPage: { type: Object },
  aiPrompt: { type: String },
  aiConfig: { type: Object },
  figmaUrl: { type: String },
  preview: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const DesignGenModel = mongoose.model('DesignGen', DesignGenSchema); 