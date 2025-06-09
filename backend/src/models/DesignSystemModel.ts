import mongoose from '../db/mongo';

const DesignSystemSchema = new mongoose.Schema({
  libraryId: { type: String, required: true },
  colors: { type: Array, default: [] },
  fonts: { type: Array, default: [] },
  spacing: { type: Array, default: [] },
  generatedAt: { type: Date, default: Date.now }
});

export const DesignSystemModel = mongoose.model('DesignSystem', DesignSystemSchema); 