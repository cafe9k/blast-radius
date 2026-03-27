import glob from 'fast-glob';
import path from 'path';
import type { ScanConfig } from '../types/config.js';

export interface ScannedFile {
  path: string;
  absolutePath: string;
  extension: string;
}

export async function scanFiles(
  projectPath: string,
  config: ScanConfig
): Promise<ScannedFile[]> {
  const includePatterns = config.include || ['**/*.{ts,tsx,jsx}'];
  const excludePatterns = config.exclude || ['node_modules/**'];
  
  const files = await glob(includePatterns, {
    cwd: projectPath,
    absolute: true,
    ignore: excludePatterns,
    onlyFiles: true,
  });
  
  return files.map(file => ({
    path: path.relative(projectPath, file),
    absolutePath: file,
    extension: path.extname(file),
  }));
}
