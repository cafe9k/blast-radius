import { useMemo } from 'react';
import Graph from 'graphology';
import forceLayout from 'graphology-layout-force';
import circular from 'graphology-layout/circular';
import louvain from 'graphology-communities-louvain';
import type { AnalysisData, ColorMode } from '../types';

export type LayoutType = 'force' | 'circular' | 'random';

// Predefined community colors (GitHub Dark palette for up to 12 communities)
const COMMUNITY_COLORS = [
  '#a371f7', // GitHub Purple
  '#58a6ff', // GitHub Blue
  '#f85149', // GitHub Red
  '#3fb950', // GitHub Green
  '#f0883e', // GitHub Orange
  '#db61a2', // GitHub Pink
  '#79c0ff', // GitHub Light Blue
  '#d29922', // GitHub Yellow
  '#7ee787', // GitHub Light Green
  '#ff7b72', // GitHub Coral
  '#d2a8ff', // GitHub Light Purple
  '#ffa657', // GitHub Light Orange
];

// Detect cycles in the graph using DFS
function detectCycles(graph: Graph): Set<string> {
  const nodesInCycles = new Set<string>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    let foundCycle = false;
    graph.forEachOutNeighbor(node, (neighbor) => {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          foundCycle = true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - mark all nodes in the cycle
        const cycleStart = path.indexOf(neighbor);
        for (let i = cycleStart; i < path.length; i++) {
          nodesInCycles.add(path[i]);
        }
        nodesInCycles.add(neighbor);
        foundCycle = true;
      }
    });

    path.pop();
    recursionStack.delete(node);
    return foundCycle;
  }

  graph.forEachNode((node) => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });

  return nodesInCycles;
}

// Apply different layout algorithms
function applyLayout(graph: Graph, layoutType: LayoutType) {
  if (graph.order === 0) return;

  switch (layoutType) {
    case 'force':
      // Reset to random positions first
      graph.forEachNode((node) => {
        graph.setNodeAttribute(node, 'x', Math.random() * 100);
        graph.setNodeAttribute(node, 'y', Math.random() * 100);
      });
      forceLayout(graph, { maxIterations: 100 });
      break;
    
    case 'circular':
      circular.assign(graph, { scale: 50 });
      break;
    
    case 'random':
      graph.forEachNode((node) => {
        graph.setNodeAttribute(node, 'x', Math.random() * 100);
        graph.setNodeAttribute(node, 'y', Math.random() * 100);
      });
      break;
  }
}

export function useGraph(
  data: AnalysisData | null, 
  searchQuery: string, 
  riskFilter: string, 
  colorMode: ColorMode = 'risk',
  layoutType: LayoutType = 'force'
) {
  return useMemo(() => {
    if (!data) return null;
    
    const graph = new Graph({ type: 'directed' });
    
    // Create metrics map for quick lookup
    const metricsMap = new Map(
      data.metrics.map(m => [m.componentId, m])
    );
    
    // Calculate max lineCount for node size normalization
    const lineCounts = data.components.map(c => c.lineCount || 0);
    const maxLineCount = Math.max(...lineCounts, 1);
    
    // Add nodes
    data.components.forEach(component => {
      const metrics = metricsMap.get(component.id);
      
      // Apply filters
      if (riskFilter !== 'all' && metrics?.level !== riskFilter) {
        return;
      }
      
      if (searchQuery && !component.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      
      // Node size based on lineCount relative value (5-30)
      const lineCount = component.lineCount || 0;
      const nodeSize = 5 + (lineCount / maxLineCount) * 25;
      
      graph.addNode(component.id, {
        label: component.name,
        componentType: component.type,
        path: component.path,
        size: nodeSize,
        color: getRiskColor(metrics?.level || 'low'),
        originalColor: getRiskColor(metrics?.level || 'low'),
        riskLevel: metrics?.level || 'low',
        riskScore: metrics?.riskScore || 0,
        lineCount: lineCount,
        // Initial random positions for force layout
        x: Math.random() * 100,
        y: Math.random() * 100,
        highlighted: false,
        inCycle: false,
      });
    });
    
    // Add edges
    data.components.forEach(component => {
      if (!graph.hasNode(component.id)) return;
      
      component.dependencies.forEach(depId => {
        if (graph.hasNode(depId)) {
          graph.addEdge(component.id, depId, {
            color: 'rgba(148, 163, 184, 0.12)',
            originalColor: 'rgba(148, 163, 184, 0.12)',
            size: 0.3,
            highlighted: false,
          });
        }
      });
    });
    
    // Apply selected layout
    applyLayout(graph, layoutType);
    
    // Detect communities using Louvain algorithm
    if (graph.order > 1) {
      const communities = louvain(graph);
      
      // Map community IDs to colors and update nodes
      graph.forEachNode((node, attributes) => {
        const communityId = communities[node];
        const communityColor = COMMUNITY_COLORS[communityId % COMMUNITY_COLORS.length];
        
        graph.setNodeAttribute(node, 'community', communityId);
        graph.setNodeAttribute(node, 'communityColor', communityColor);
        graph.setNodeAttribute(node, 'originalCommunityColor', communityColor);
        
        // Update color based on colorMode
        if (colorMode === 'community') {
          graph.setNodeAttribute(node, 'color', communityColor);
          graph.setNodeAttribute(node, 'originalColor', communityColor);
        }
      });
    }
    
    // Detect cycles and mark nodes
    const nodesInCycles = detectCycles(graph);
    graph.forEachNode((node) => {
      graph.setNodeAttribute(node, 'inCycle', nodesInCycles.has(node));
    });
    
    return graph;
  }, [data, searchQuery, riskFilter, colorMode, layoutType]);
}

function getRiskColor(level: string): string {
  const colors = {
    low: '#3fb950',    // GitHub success green
    medium: '#d29922', // GitHub warning yellow
    high: '#f0883e',   // GitHub orange
    critical: '#f85149', // GitHub danger red
  };
  return colors[level as keyof typeof colors] || colors.low;
}
