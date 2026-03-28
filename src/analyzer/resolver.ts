import path from 'path';
import fs from 'fs-extra';
import enhancedResolve from 'enhanced-resolve';
import type { TsConfigJson } from 'type-fest';

const resolverCache = new Map<string, any>();

export function resolveModulePath(
  importPath: string,
  fromFile: string,
  projectPath: string
): string | null {
  // Skip node_modules imports (bare imports without alias prefix)
  // Allow relative paths, absolute paths, and known alias prefixes
  const isRelative = importPath.startsWith('.');
  const isAbsolute = importPath.startsWith('/');
  const isAlias = importPath.startsWith('@/');
  
  if (!isRelative && !isAbsolute && !isAlias) {
    return null;
  }
  
  // Get or create resolver for this project
  let resolver = resolverCache.get(projectPath);
  if (!resolver) {
    resolver = createResolver(projectPath);
    resolverCache.set(projectPath, resolver);
  }
  
  try {
    const fromDir = path.dirname(path.join(projectPath, fromFile));
    // resolver is already a sync function from enhancedResolve.create.sync
    const resolved = resolver(fromDir, importPath);
    
    if (resolved) {
      // Convert back to project-relative path
      const relativePath = path.relative(projectPath, resolved);
      return normalizePath(relativePath);
    }
  } catch (error) {
    // Resolution failed, skip this dependency
  }
  
  return null;
}

function createResolver(projectPath: string) {
  const tsConfigPath = path.join(projectPath, 'tsconfig.json');
  const jsConfigPath = path.join(projectPath, 'jsconfig.json');
  
  let aliasMap: Record<string, string[]> = {};
  
  // Load tsconfig paths
  if (fs.existsSync(tsConfigPath)) {
    aliasMap = loadTsConfigPaths(tsConfigPath, projectPath);
  } else if (fs.existsSync(jsConfigPath)) {
    aliasMap = loadTsConfigPaths(jsConfigPath, projectPath);
  }
  
  // Use enhancedResolve.create.sync for synchronous resolver
  // Note: create.sync returns a sync function directly, not a resolver object
  const createSyncResolver = (enhancedResolve.create as any).sync;
  
  return createSyncResolver({
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: aliasMap,
    modules: ['node_modules'],
    mainFields: ['browser', 'module', 'main'],
    conditionNames: ['import', 'require', 'default'],
  });
}

function loadTsConfigPaths(configPath: string, projectPath: string): Record<string, string[]> {
  try {
    const config: TsConfigJson = fs.readJSONSync(configPath);
    const paths = config.compilerOptions?.paths || {};
    const baseUrl = config.compilerOptions?.baseUrl || '.';
    
    const aliasMap: Record<string, string[]> = {};
    
    for (const [key, value] of Object.entries(paths)) {
      // Convert path pattern to alias
      // e.g., "@/*" -> ["./*"]
      const aliasKey = key.replace(/\/\*$/, '');
      const aliasValues = (Array.isArray(value) ? value : [value]).map(v => {
        const normalized = v.replace(/\/\*$/, '');
        return path.resolve(projectPath, baseUrl, normalized);
      });
      
      aliasMap[aliasKey] = aliasValues;
    }
    
    return aliasMap;
  } catch (error) {
    return {};
  }
}

function normalizePath(p: string): string {
  // Ensure consistent path format across platforms
  return p.split(path.sep).join('/');
}
