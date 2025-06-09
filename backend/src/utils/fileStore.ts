import fs from 'fs';
import path from 'path';

export function readJsonFile<T>(file: string, defaultValue: T): T {
  try {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) return defaultValue;
    const data = fs.readFileSync(abs, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

export function writeJsonFile<T>(file: string, data: T) {
  const abs = path.resolve(file);
  fs.writeFileSync(abs, JSON.stringify(data, null, 2), 'utf-8');
} 