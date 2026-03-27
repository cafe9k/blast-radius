import type { ScanConfig } from '../types/config';
import type { ScannedFile } from './scanner';
import type { ComponentNode } from '../types/component';
import Graph from 'graphology';

export interface DependencyNode {
  id: string;
  name: string;
  path: string;
  type: 'react' | 'unknown';
  size?: number;
  x?: number;
  y?: number;
}

export interface DependencyEdge {
  source: string;
  target: string;
}

export async function buildDependencyGraph(
  components: ComponentNode[],
  projectPath: string
): Promise<Graph> {
  const graph = new Graph({ type: 'directed' });
  
  // Add nodes
  for (const component of components) {
    graph.addNode(component.id, {
      label: component.name,
      type: component.type,
      path: component.path,
      lineCount: component.lineCount,
      exports: component.exports,
    });
  }
  
  // Add edges
  for (const component of components) {
    for (const depId of component.dependencies) {
      if (graph.hasNode(depId) && !graph.hasEdge(component.id, depId)) {
        graph.addEdge(component.id, depId);
      }
    }
  }
  
  return graph;
}

export function getGraphStats(graph: Graph): {
  nodeCount: number;
  edgeCount: number;
  density: number;
  avgDegree: number;
} {
  const nodeCount = graph.order;
  const edgeCount = graph.size;
  const density = nodeCount > 1 ? edgeCount / (nodeCount * (nodeCount - 1)) : 0;
  const avgDegree = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0;
  
  return {
    nodeCount,
    edgeCount,
    density,
    avgDegree,
  };
}

export function findCircularDependencies(graph: Graph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  
  function dfs(node: string) {
    if (recursionStack.has(node)) {
      // Found cycle
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push([...path.slice(cycleStart), node]);
      }
      return;
    }
    
    if (visited.has(node)) {
      return;
    }
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    graph.forEachOutNeighbor(node, (neighbor) => {
      dfs(neighbor);
    });
    
    path.pop();
    recursionStack.delete(node);
  }
  
  graph.forEachNode((node) => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });
  
  return cycles;
}

export function getDependents(graph: Graph, nodeId: string): string[] {
  const dependents: string[] = [];
  graph.forEachInNeighbor(nodeId, (neighbor) => {
    dependents.push(neighbor);
  });
  return dependents;
}

export function getDependencies(graph: Graph, nodeId: string): string[] {
  const dependencies: string[] = [];
  graph.forEachOutNeighbor(nodeId, (neighbor) => {
    dependencies.push(neighbor);
  });
  return dependencies;
}
