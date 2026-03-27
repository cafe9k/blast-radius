import type Graph from 'graphology';

export interface BlastRadiusMetrics {
  componentId: string;
  fanIn: number;
  fanOut: number;
  depth: number;
  breadth: number;
  riskScore: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalysisResult {
  project: {
    name: string;
    path: string;
    componentCount: number;
    analyzedAt: string;
  };
  components: any[];
  metrics: Map<string, BlastRadiusMetrics>;
  aiInsights?: AIInsights | null;
}

export interface AIInsights {
  summary: string;
  risks: string[];
  suggestions: string[];
  analyzedAt: string;
}

export type DependencyGraph = Graph;
