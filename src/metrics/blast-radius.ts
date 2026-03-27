import type Graph from 'graphology';
import type { ComponentNode } from '../types/component.js';
import type { BlastRadiusMetrics } from '../types/graph.js';

export async function calculateBlastRadius(
  graph: Graph,
  components: ComponentNode[]
): Promise<Map<string, BlastRadiusMetrics>> {
  const metrics = new Map<string, BlastRadiusMetrics>();
  
  for (const node of graph.nodes()) {
    const inDegree = graph.inDegree(node);
    const outDegree = graph.outDegree(node);
    
    // Calculate depth (BFS to find maximum downstream level)
    const depth = calculateDownstreamDepth(graph, node);
    
    // Calculate breadth (total affected files)
    const breadth = calculateAffectedBreadth(graph, node);
    
    // Calculate risk score
    const riskScore = calculateRiskScore(inDegree, outDegree, depth, breadth);
    
    metrics.set(node, {
      componentId: node,
      fanIn: inDegree,
      fanOut: outDegree,
      depth,
      breadth,
      riskScore,
      level: getRiskLevel(riskScore),
    });
  }
  
  return metrics;
}

function calculateDownstreamDepth(graph: Graph, startNode: string): number {
  const visited = new Set<string>();
  const queue: { node: string; level: number }[] = [{ node: startNode, level: 0 }];
  let maxDepth = 0;
  
  while (queue.length > 0) {
    const { node, level } = queue.shift()!;
    
    if (visited.has(node)) {
      continue;
    }
    
    visited.add(node);
    
    // Follow outgoing edges (dependencies)
    graph.forEachOutNeighbor(node, (neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, level: level + 1 });
        maxDepth = Math.max(maxDepth, level + 1);
      }
    });
  }
  
  return maxDepth;
}

function calculateAffectedBreadth(graph: Graph, startNode: string): number {
  const visited = new Set<string>();
  const queue: string[] = [startNode];
  
  while (queue.length > 0) {
    const node = queue.shift()!;
    
    if (visited.has(node)) {
      continue;
    }
    
    visited.add(node);
    
    // Follow incoming edges (dependents - files that depend on this)
    graph.forEachInNeighbor(node, (neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }
  
  // Exclude the starting node itself
  return Math.max(0, visited.size - 1);
}

function calculateRiskScore(
  fanIn: number,
  fanOut: number,
  depth: number,
  breadth: number
): number {
  // Weighted scoring algorithm
  // High fan-in = many dependents = high risk
  // High fan-out = many dependencies = moderate risk
  // High depth = deep dependency chain = moderate risk
  // High breadth = wide impact = high risk
  
  const weights = {
    fanIn: 10,      // Most important - impact on other components
    breadth: 8,     // High importance - total affected files
    fanOut: 5,      // Moderate - dependency complexity
    depth: 3,       // Lower - depth matters but less than breadth
  };
  
  const score = 
    fanIn * weights.fanIn +
    breadth * weights.breadth +
    fanOut * weights.fanOut +
    depth * weights.depth;
  
  // Normalize to 0-100
  return Math.min(100, Math.round(score / 2));
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
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
