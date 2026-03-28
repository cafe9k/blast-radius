import * as parser from '@babel/parser';
import traverseDefault from '@babel/traverse';
const traverse = (traverseDefault as any).default || traverseDefault;
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import os from 'os';
import type { ScannedFile } from '../scanner';
import type { ComponentNode, ImportStatement } from '../../types/component';
import { resolveModulePath } from '../resolver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get optimal number of workers
function getWorkerCount(): number {
  const cpus = os.cpus().length;
  return Math.min(Math.max(cpus, 2), 8);
}

// Chunk array into N pieces
function chunkArray<T>(array: T[], chunks: number): T[][] {
  const result: T[][] = [];
  const chunkSize = Math.ceil(array.length / chunks);
  
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  
  return result;
}

export async function parseReactComponents(
  files: ScannedFile[],
  projectPath: string
): Promise<ComponentNode[]> {
  // For small file counts, use serial parsing
  if (files.length < 10) {
    return parseReactComponentsSerial(files, projectPath);
  }
  
  // Try parallel parsing
  try {
    return await parseReactComponentsParallel(files, projectPath);
  } catch (error) {
    // Fallback to serial on worker error
    console.error('Worker parsing failed, falling back to serial:', error);
    return parseReactComponentsSerial(files, projectPath);
  }
}

async function parseReactComponentsParallel(
  files: ScannedFile[],
  projectPath: string
): Promise<ComponentNode[]> {
  const workerCount = getWorkerCount();
  const chunks = chunkArray(files, workerCount);
  
  // Get worker script path
  const workerPath = path.join(__dirname, 'worker.js');
  
  // Check if worker script exists
  const workerExists = await fs.pathExists(workerPath);
  if (!workerExists) {
    return parseReactComponentsSerial(files, projectPath);
  }
  
  // Create workers and parse chunks in parallel
  const workerPromises = chunks.map(chunk => {
    return new Promise<ComponentNode[]>((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: {
          files: chunk,
          projectPath,
        },
      });
      
      worker.on('message', (result: ComponentNode[]) => {
        resolve(result);
        worker.terminate();
      });
      
      worker.on('error', (error) => {
        reject(error);
        worker.terminate();
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  });
  
  const results = await Promise.all(workerPromises);
  const components = results.flat();
  
  // Build dependents list
  const componentMap = new Map<string, ComponentNode>();
  components.forEach(c => componentMap.set(c.id, c));
  
  for (const component of components) {
    for (const depId of component.dependencies) {
      const dep = componentMap.get(depId);
      if (dep && !dep.dependents.includes(component.id)) {
        dep.dependents.push(component.id);
      }
    }
  }
  
  return components;
}

async function parseReactComponentsSerial(
  files: ScannedFile[],
  projectPath: string
): Promise<ComponentNode[]> {
  const components: ComponentNode[] = [];
  
  for (const file of files) {
    try {
      const component = await parseFile(file, projectPath);
      if (component) {
        components.push(component);
      }
    } catch (error) {
      console.error(`Error parsing ${file.path}:`, error);
    }
  }
  
  // Build dependents list
  const componentMap = new Map<string, ComponentNode>();
  components.forEach(c => componentMap.set(c.id, c));
  
  for (const component of components) {
    for (const depId of component.dependencies) {
      const dep = componentMap.get(depId);
      if (dep && !dep.dependents.includes(component.id)) {
        dep.dependents.push(component.id);
      }
    }
  }
  
  return components;
}

async function parseFile(
  file: ScannedFile,
  projectPath: string
): Promise<ComponentNode | null> {
  const content = await fs.readFile(file.absolutePath, 'utf-8');
  const lineCount = content.split('\n').length;
  
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'classProperties',
      'objectRestSpread',
      'dynamicImport',
    ],
    sourceFilename: file.path,
  });
  
  const imports: ImportStatement[] = [];
  const exports: string[] = [];
  const dependencies: string[] = [];
  
  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const specifiers = path.node.specifiers.map(s => {
        if (s.type === 'ImportDefaultSpecifier') {
          return s.local.name;
        }
        if (s.type === 'ImportNamespaceSpecifier') {
          return `* as ${s.local.name}`;
        }
        return s.imported.type === 'Identifier' ? s.imported.name : s.local.name;
      });
      
      imports.push({
        source,
        specifiers,
        isDefault: path.node.specifiers.some(s => s.type === 'ImportDefaultSpecifier'),
        isNamespace: path.node.specifiers.some(s => s.type === 'ImportNamespaceSpecifier'),
        line: path.node.loc?.start.line || 0,
      });
      
      // Resolve relative imports to component IDs
      const resolvedPath = resolveModulePath(source, file.path, projectPath);
      if (resolvedPath && !dependencies.includes(resolvedPath)) {
        dependencies.push(resolvedPath);
      }
    },
    
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
          exports.push(path.node.declaration.id.name);
        }
        if (path.node.declaration.type === 'VariableDeclaration') {
          path.node.declaration.declarations.forEach(d => {
            if (d.id.type === 'Identifier') {
              exports.push(d.id.name);
            }
          });
        }
      }
    },
    
    ExportDefaultDeclaration(path) {
      exports.push('default');
    },
  });
  
  // Detect React component
  const componentName = detectComponentName(file.path, exports);
  if (!componentName) {
    return null; // Not a component file
  }
  
  return {
    id: file.path,
    name: componentName,
    path: file.path,
    type: 'react',
    dependencies,
    dependents: [],
    lineCount,
    exports,
    imports: imports.map(i => i.source),
  };
}

function detectComponentName(filePath: string, exports: string[]): string {
  // Priority: default export > named export matching filename > filename
  const fileName = path.basename(filePath, path.extname(filePath));
  
  if (exports.includes('default')) {
    // Default export component
    if (fileName === 'index') {
      // index.tsx - use parent directory name
      const dirName = path.basename(path.dirname(filePath));
      return capitalize(dirName);
    }
    return capitalize(fileName);
  }
  
  // Named exports - check if any matches PascalCase (component convention)
  const componentExport = exports.find(e => /^[A-Z]/.test(e) && e !== 'default');
  if (componentExport) {
    return componentExport;
  }
  
  // Fallback to filename
  if (fileName === 'index') {
    const dirName = path.basename(path.dirname(filePath));
    return capitalize(dirName);
  }
  
  return capitalize(fileName);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
