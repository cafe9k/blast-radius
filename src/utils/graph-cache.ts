/**
 * Graph structure cache using SQLite for incremental analysis
 * Falls back to JSON file cache if SQLite is not available
 */
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import type { ComponentNode } from '../types/component';

let db: any = null;
let useSQLite = false;
let cachePath = '';

export interface CachedFile {
  path: string;
  hash: string;
  component: ComponentNode | null;
}

export interface CacheDiff {
  added: string[];
  modified: string[];
  deleted: string[];
  unchanged: string[];
}

interface JsonCache {
  files: Record<string, { hash: string; component: ComponentNode | null }>;
}

/**
 * Initialize the graph cache database
 */
export function initGraphCache(projectPath: string, cacheDir?: string): void {
  cachePath = cacheDir
    ? path.join(projectPath, cacheDir, 'graph-cache.json')
    : path.join(projectPath, '.blast-radius', 'cache', 'graph-cache.json');
  
  fs.ensureDirSync(path.dirname(cachePath));
  
  // Try to use SQLite if available
  try {
    const Database = require('better-sqlite3');
    const dbPath = cachePath.replace('.json', '.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        path TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        component_json TEXT,
        updated_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);
    `);
    useSQLite = true;
  } catch {
    // SQLite not available, use JSON fallback
    useSQLite = false;
    db = null;
  }
}

/**
 * Close the database connection
 */
export function closeGraphCache(): void {
  if (db && useSQLite) {
    db.close();
  }
  db = null;
  useSQLite = false;
}

/**
 * Calculate file hash
 */
export function calculateFileHash(filePath: string, projectPath: string): string {
  const absolutePath = path.join(projectPath, filePath);
  const content = fs.readFileSync(absolutePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Get all cached files
 */
export function getCachedFiles(): Map<string, { hash: string; component: ComponentNode | null }> {
  if (useSQLite && db) {
    const stmt = db.prepare('SELECT path, hash, component_json FROM files');
    const rows = stmt.all() as Array<{ path: string; hash: string; component_json: string | null }>;
    
    const result = new Map<string, { hash: string; component: ComponentNode | null }>();
    for (const row of rows) {
      result.set(row.path, {
        hash: row.hash,
        component: row.component_json ? JSON.parse(row.component_json) : null,
      });
    }
    return result;
  }
  
  // JSON fallback
  if (!fs.pathExistsSync(cachePath)) {
    return new Map();
  }
  
  try {
    const cache: JsonCache = fs.readJSONSync(cachePath);
    return new Map(Object.entries(cache.files));
  } catch {
    return new Map();
  }
}

/**
 * Compute diff between current files and cache
 */
export function computeCacheDiff(
  currentFiles: string[],
  projectPath: string
): CacheDiff {
  const cachedFiles = getCachedFiles();
  const currentFileSet = new Set(currentFiles);
  
  const diff: CacheDiff = {
    added: [],
    modified: [],
    deleted: [],
    unchanged: [],
  };
  
  // Check each current file
  for (const filePath of currentFiles) {
    const cached = cachedFiles.get(filePath);
    
    if (!cached) {
      diff.added.push(filePath);
    } else {
      const currentHash = calculateFileHash(filePath, projectPath);
      if (currentHash !== cached.hash) {
        diff.modified.push(filePath);
      } else {
        diff.unchanged.push(filePath);
      }
    }
  }
  
  // Find deleted files
  for (const [filePath] of cachedFiles) {
    if (!currentFileSet.has(filePath)) {
      diff.deleted.push(filePath);
    }
  }
  
  return diff;
}

/**
 * Get cached components for unchanged files
 */
export function getCachedComponents(unchangedFiles: string[]): ComponentNode[] {
  const cachedFiles = getCachedFiles();
  return unchangedFiles
    .map(f => cachedFiles.get(f)?.component)
    .filter((c): c is ComponentNode => c !== null && c !== undefined);
}

/**
 * Update cache with new/modified files
 */
export function updateCache(
  files: Array<{ path: string; component: ComponentNode | null }>,
  projectPath: string
): void {
  if (files.length === 0) return;
  
  if (useSQLite && db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO files (path, hash, component_json, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    
    const now = Date.now();
    const insertMany = db.transaction((items: typeof files) => {
      for (const item of items) {
        const hash = calculateFileHash(item.path, projectPath);
        stmt.run(
          item.path,
          hash,
          item.component ? JSON.stringify(item.component) : null,
          now
        );
      }
    });
    
    insertMany(files);
    return;
  }
  
  // JSON fallback
  let cache: JsonCache = { files: {} };
  
  if (fs.pathExistsSync(cachePath)) {
    try {
      cache = fs.readJSONSync(cachePath);
    } catch {
      // Ignore
    }
  }
  
  for (const item of files) {
    const hash = calculateFileHash(item.path, projectPath);
    cache.files[item.path] = {
      hash,
      component: item.component,
    };
  }
  
  fs.writeJSONSync(cachePath, cache, { spaces: 2 });
}

/**
 * Remove deleted files from cache
 */
export function removeCachedFiles(deletedFiles: string[]): void {
  if (deletedFiles.length === 0) return;
  
  if (useSQLite && db) {
    const placeholders = deletedFiles.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM files WHERE path IN (${placeholders})`);
    stmt.run(...deletedFiles);
    return;
  }
  
  // JSON fallback
  if (!fs.pathExistsSync(cachePath)) return;
  
  try {
    const cache: JsonCache = fs.readJSONSync(cachePath);
    for (const f of deletedFiles) {
      delete cache.files[f];
    }
    fs.writeJSONSync(cachePath, cache, { spaces: 2 });
  } catch {
    // Ignore
  }
}

/**
 * Get cache statistics
 */
export function getGraphCacheStats(): { cachedFiles: number; cacheSize: string } {
  const cachedFiles = getCachedFiles();
  
  let size = 0;
  try {
    const stats = fs.statSync(useSQLite ? cachePath.replace('.json', '.db') : cachePath);
    size = stats.size;
  } catch {
    // Ignore
  }
  
  return {
    cachedFiles: cachedFiles.size,
    cacheSize: formatBytes(size),
  };
}

/**
 * Clear the graph cache
 */
export function clearGraphCache(): void {
  if (useSQLite && db) {
    db.exec('DELETE FROM files');
    return;
  }
  
  if (fs.pathExistsSync(cachePath)) {
    fs.writeJSONSync(cachePath, { files: {} }, { spaces: 2 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
