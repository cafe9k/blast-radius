/**
 * Worker script for parallel AST parsing
 * Receives a chunk of files, parses them, and returns ComponentNode[]
 */
import { parentPort, workerData } from 'worker_threads';
import * as parser from '@babel/parser';
import traverseDefault from '@babel/traverse';
import fs from 'fs-extra';
import path from 'path';
import type { ComponentNode, ImportStatement } from '../../types/component';
import { resolveModulePath } from '../resolver';

const traverse = (traverseDefault as any).default || traverseDefault;

interface WorkerData {
  files: Array<{
    path: string;
    absolutePath: string;
    extension: string;
  }>;
  projectPath: string;
}

async function parseFile(
  file: { path: string; absolutePath: string; extension: string },
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
  const fileName = path.basename(filePath, path.extname(filePath));
  
  if (exports.includes('default')) {
    if (fileName === 'index') {
      const dirName = path.basename(path.dirname(filePath));
      return capitalize(dirName);
    }
    return capitalize(fileName);
  }
  
  const componentExport = exports.find(e => /^[A-Z]/.test(e) && e !== 'default');
  if (componentExport) {
    return componentExport;
  }
  
  if (fileName === 'index') {
    const dirName = path.basename(path.dirname(filePath));
    return capitalize(dirName);
  }
  
  return capitalize(fileName);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Worker entry point
async function main() {
  const { files, projectPath } = workerData as WorkerData;
  const results: ComponentNode[] = [];
  
  for (const file of files) {
    try {
      const component = await parseFile(file, projectPath);
      if (component) {
        results.push(component);
      }
    } catch (error) {
      // Log error but continue with other files
      console.error(`Error parsing ${file.path}:`, error);
    }
  }
  
  parentPort?.postMessage(results);
}

main().catch(error => {
  console.error('Worker error:', error);
  parentPort?.postMessage([]);
});
