import { useMemo } from 'react';
import Graph from 'graphology';
import forceLayout from 'graphology-layout-force';
import louvain from 'graphology-communities-louvain';
import type { AnalysisData, ColorMode } from '../types';

// Predefined community colors (palette for up to 12 communities)
const COMMUNITY_COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#84CC16', // Lime
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#EF4444', // Red
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#EAB308', // Yellow
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

export function useGraph(data: AnalysisData | null, searchQuery: string, riskFilter: string, colorMode: ColorMode = 'risk') {
  return useMemo(() => {
    if (!data) return null;
    
    const graph = new Graph({ type: 'directed' });
    
    // Create metrics map for quick lookup
    const metricsMap = new Map(
      data.metrics.map(m => [m.componentId, m])
    );
    
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
      
      graph.addNode(component.id, {
        label: component.name,
        componentType: component.type,
        path: component.path,
        size: Math.max(5, (metrics?.fanIn || 0) * 2 + 5),
        color: getRiskColor(metrics?.level || 'low'),
        originalColor: getRiskColor(metrics?.level || 'low'),
        riskLevel: metrics?.level || 'low',
        riskScore: metrics?.riskScore || 0,
        fanIn: metrics?.fanIn || 0,
        fanOut: metrics?.fanOut || 0,
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
            color: 'rgba(0, 217, 255, 0.3)',
            originalColor: 'rgba(0, 217, 255, 0.3)',
            size: 0.5,
            highlighted: false,
          });
        }
      });
    });
    
    // Apply force-directed layout
    if (graph.order > 0) {
      forceLayout(graph, { maxIterations: 100 });
    }
    
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
  }, [data, searchQuery, riskFilter, colorMode]);
}

function getRiskColor(level: string): string {
  const colors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  };
  return colors[level as keyof typeof colors] || colors.low;
}
