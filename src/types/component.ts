export interface ComponentNode {
  id: string;
  name: string;
  path: string;
  type: 'react' | 'unknown';
  dependencies: string[];
  dependents: string[];
  lineCount?: number;
  exports?: string[];
  imports?: string[];
}

export interface ComponentLocation {
  file: string;
  line: number;
  column: number;
}

export interface ImportStatement {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  line: number;
}
