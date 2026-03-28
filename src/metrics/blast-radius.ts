import type Graph from 'graphology';
import type { ComponentNode } from '../types/component';
import type { BlastRadiusMetrics } from '../types/graph';

export async function calculateBlastRadius(
  graph: Graph,
  components: ComponentNode[]
): Promise<Map<string, BlastRadiusMetrics>> {
  const metrics = new Map<string, BlastRadiusMetrics>();
  
  // Create a map for quick component lookup
  const componentMap = new Map<string, ComponentNode>();
  for (const component of components) {
    componentMap.set(component.id, component);
  }
  
  for (const node of graph.nodes()) {
    const component = componentMap.get(node);
    const lineCount = component?.lineCount || 0;
    const riskScore = lineCount;
    const level = getRiskLevel(lineCount);
    
    metrics.set(node, {
      componentId: node,
      lineCount,
      riskScore,
      level,
    });
  }
  
  return metrics;
}

function getRiskLevel(lineCount: number): 'low' | 'medium' | 'high' | 'critical' {
  if (lineCount >= 500) return 'critical';
  if (lineCount >= 300) return 'high';
  if (lineCount >= 100) return 'medium';
  return 'low';
}

export function getTopRiskComponents(
  metrics: Map<string, BlastRadiusMetrics>,
  limit: number = 10
): Array<{ id: string; metrics: BlastRadiusMetrics }> {
  return Array.from(metrics.entries())
    .map(([id, m]) => ({ id, metrics: m }))
    .sort((a, b) => b.metrics.riskScore - a.metrics.riskScore)
    .slice(0, limit);
}

export function getRiskDistribution(
  metrics: Map<string, BlastRadiusMetrics>
): Record<'low' | 'medium' | 'high' | 'critical', number> {
  const distribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  
  for (const m of metrics.values()) {
    distribution[m.level]++;
  }
  
  return distribution;
}

export function calculateOverallHealthScore(
  metrics: Map<string, BlastRadiusMetrics>
): number {
  if (metrics.size === 0) return 100;
  
  const distribution = getRiskDistribution(metrics);
  const total = metrics.size;
  
  // Calculate health score (inverse of risk)
  const riskScore = 
    (distribution.critical * 100 + 
     distribution.high * 75 + 
     distribution.medium * 50 + 
     distribution.low * 25) / total;
  
  return Math.max(0, Math.round(100 - riskScore));
}
