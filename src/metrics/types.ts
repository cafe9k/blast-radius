export interface MetricSummary {
  totalComponents: number;
  totalDependencies: number;
  avgFanIn: number;
  avgFanOut: number;
  maxDepth: number;
  maxBreadth: number;
  avgRiskScore: number;
  healthScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface ComponentMetric {
  componentId: string;
  componentName: string;
  path: string;
  fanIn: number;
  fanOut: number;
  depth: number;
  breadth: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
