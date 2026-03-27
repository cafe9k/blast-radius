import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = '.blast-radius/cache';
let cacheDir: string = '';

export async function initCache(projectPath: string, customCacheDir?: string): Promise<void> {
  cacheDir = customCacheDir
    ? path.resolve(projectPath, customCacheDir)
    : path.join(projectPath, CACHE_DIR);
  
  await fs.ensureDir(cacheDir);
}

export async function getFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

export async function getCachedResult(key: string): Promise<any | null> {
  if (!cacheDir) return null;
  
  const cacheFile = path.join(cacheDir, `${key}.json`);
  
  if (await fs.pathExists(cacheFile)) {
    return await fs.readJSON(cacheFile);
  }
  
  return null;
}

export async function setCachedResult(key: string, data: any): Promise<void> {
  if (!cacheDir) return;
  
  const cacheFile = path.join(cacheDir, `${key}.json`);
  await fs.writeJSON(cacheFile, data);
}

export async function getCacheStats(): Promise<{ cachedFiles: number; cacheSize: string }> {
  if (!cacheDir || !(await fs.pathExists(cacheDir))) {
    return { cachedFiles: 0, cacheSize: '0 B' };
  }
  
  const files = await fs.readdir(cacheDir);
  const stats = await Promise.all(
    files.map(file => fs.stat(path.join(cacheDir, file)))
  );
  
  const totalSize = stats.reduce((sum, stat) => sum + stat.size, 0);
  
  return {
    cachedFiles: files.length,
    cacheSize: formatBytes(totalSize),
  };
}

export async function clearCache(): Promise<void> {
  if (cacheDir && (await fs.pathExists(cacheDir))) {
    await fs.emptyDir(cacheDir);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
