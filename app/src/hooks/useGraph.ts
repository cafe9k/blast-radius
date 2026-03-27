import { useMemo } from 'react';
import Graph from 'graphology';
import type { AnalysisData } from '../types';

export function useGraph(data: AnalysisData | null, searchQuery: string, riskFilter: string) {
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
        type: component.type,
        path: component.path,
        size: Math.max(5, (metrics?.fanIn || 0) * 2 + 5),
        color: getRiskColor(metrics?.level || 'low'),
        riskLevel: metrics?.level || 'low',
        riskScore: metrics?.riskScore || 0,
        fanIn: metrics?.fanIn || 0,
        fanOut: metrics?.fanOut || 0,
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
    
    return graph;
  }, [data, searchQuery, riskFilter]);
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
