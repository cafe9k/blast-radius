import { describe, it, expect } from 'vitest';
import Graph from 'graphology';
import { calculateBlastRadius, getRiskDistribution } from '../src/metrics/blast-radius.js';
import type { ComponentNode } from '../src/types/component.js';

describe('Blast Radius Calculator', () => {
  it('should calculate metrics for simple graph', async () => {
    const graph = new Graph({ type: 'directed' });
    graph.addNode('A', { label: 'ComponentA' });
    graph.addNode('B', { label: 'ComponentB' });
    graph.addEdge('A', 'B');
    
    const components: ComponentNode[] = [
      { id: 'A', name: 'ComponentA', path: '/a.tsx', type: 'react', dependencies: ['B'], dependents: [] },
      { id: 'B', name: 'ComponentB', path: '/b.tsx', type: 'react', dependencies: [], dependents: ['A'] },
    ];
    
    const metrics = await calculateBlastRadius(graph, components);
    
    expect(metrics.has('A')).toBe(true);
    expect(metrics.has('B')).toBe(true);
    
    const metricsA = metrics.get('A')!;
    expect(metricsA.fanIn).toBe(0);
    expect(metricsA.fanOut).toBe(1);
    expect(metricsA.level).toBe('low');
  });
  
  it('should calculate risk distribution', async () => {
    const graph = new Graph({ type: 'directed' });
    graph.addNode('A', { label: 'A' });
    graph.addNode('B', { label: 'B' });
    
    const components: ComponentNode[] = [
      { id: 'A', name: 'A', path: '/a.tsx', type: 'react', dependencies: [], dependents: [] },
      { id: 'B', name: 'B', path: '/b.tsx', type: 'react', dependencies: [], dependents: [] },
    ];
    
    const metrics = await calculateBlastRadius(graph, components);
    const distribution = getRiskDistribution(metrics);
    
    expect(distribution).toHaveProperty('low');
    expect(distribution).toHaveProperty('medium');
    expect(distribution).toHaveProperty('high');
    expect(distribution).toHaveProperty('critical');
  });
});
