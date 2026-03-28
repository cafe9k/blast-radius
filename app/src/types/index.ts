export interface AnalysisData {
  project: {
    name: string;
    path: string;
    componentCount: number;
    analyzedAt: string;
  };
  components: ComponentNode[];
  metrics: BlastRadiusMetrics[];
  aiInsights?: AIInsights | null;
}

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

export interface BlastRadiusMetrics {
  componentId: string;
  fanIn: number;
  fanOut: number;
  depth: number;
  breadth: number;
  riskScore: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIInsights {
  summary: string;
  risks: string[];
  suggestions: string[];
  analyzedAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ColorMode = 'risk' | 'community';
