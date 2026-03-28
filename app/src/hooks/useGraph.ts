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
        componentType: component.type, // Renamed to avoid conflict with Sigma's node type
        path: component.path,
        size: Math.max(5, (metrics?.fanIn || 0) * 2 + 5),
        color: getRiskColor(metrics?.level || 'low'),
        riskLevel: metrics?.level || 'low',
        riskScore: metrics?.riskScore || 0,
        fanIn: metrics?.fanIn || 0,
        fanOut: metrics?.fanOut || 0,
        // Initial random positions for force layout
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    });
    
    // Add edges
    data.components.forEach(component => {
      if (!graph.hasNode(component.id)) return;
      
      component.dependencies.forEach(depId => {
        if (graph.hasNode(depId)) {
          graph.addEdge(component.id, depId, {
            color: 'rgba(0, 217, 255, 0.3)',
            size: 0.5,
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
        
        // Update color based on colorMode
        if (colorMode === 'community') {
          graph.setNodeAttribute(node, 'color', communityColor);
        }
      });
    }
    
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
