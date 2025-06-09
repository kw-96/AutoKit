const fetch = require('node-fetch');

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export async function getFigmaFile(fileKey: string, apiKey: string) {
  const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
    headers: { 'X-Figma-Token': apiKey }
  });
  if (!res.ok) throw new Error(`Figma API请求失败: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getFigmaStyles(fileKey: string, apiKey: string) {
  const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}/styles`, {
    headers: { 'X-Figma-Token': apiKey }
  });
  if (!res.ok) throw new Error(`Figma API请求失败: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getFigmaComponents(fileKey: string, apiKey: string) {
  const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}/components`, {
    headers: { 'X-Figma-Token': apiKey }
  });
  if (!res.ok) throw new Error(`Figma API请求失败: ${res.status} ${res.statusText}`);
  return res.json();
} 