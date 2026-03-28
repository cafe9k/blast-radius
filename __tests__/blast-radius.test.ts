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
      { id: 'A', name: 'ComponentA', path: '/a.tsx', type: 'react', dependencies: ['B'], dependents: [], lineCount: 50 },
      { id: 'B', name: 'ComponentB', path: '/b.tsx', type: 'react', dependencies: [], dependents: ['A'], lineCount: 150 },
    ];
    
    const metrics = await calculateBlastRadius(graph, components);
    
    expect(metrics.has('A')).toBe(true);
    expect(metrics.has('B')).toBe(true);
    
    const metricsA = metrics.get('A')!;
    expect(metricsA.lineCount).toBe(50);
    expect(metricsA.riskScore).toBe(50);
    expect(metricsA.level).toBe('low');
    
    const metricsB = metrics.get('B')!;
    expect(metricsB.lineCount).toBe(150);
    expect(metricsB.level).toBe('medium');
  });
  
  it('should calculate risk distribution', async () => {
    const graph = new Graph({ type: 'directed' });
    graph.addNode('A', { label: 'A' });
    graph.addNode('B', { label: 'B' });
    graph.addNode('C', { label: 'C' });
    graph.addNode('D', { label: 'D' });
    
    const components: ComponentNode[] = [
      { id: 'A', name: 'A', path: '/a.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 50 },   // low
      { id: 'B', name: 'B', path: '/b.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 200 },  // medium
      { id: 'C', name: 'C', path: '/c.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 400 },  // high
      { id: 'D', name: 'D', path: '/d.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 600 },  // critical
    ];
    
    const metrics = await calculateBlastRadius(graph, components);
    const distribution = getRiskDistribution(metrics);
    
    expect(distribution.low).toBe(1);
    expect(distribution.medium).toBe(1);
    expect(distribution.high).toBe(1);
    expect(distribution.critical).toBe(1);
  });
  
  it('should classify risk levels correctly', async () => {
    const graph = new Graph({ type: 'directed' });
    graph.addNode('A', { label: 'A' });
    graph.addNode('B', { label: 'B' });
    graph.addNode('C', { label: 'C' });
    graph.addNode('D', { label: 'D' });
    
    const components: ComponentNode[] = [
      { id: 'A', name: 'A', path: '/a.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 99 },   // low (< 100)
      { id: 'B', name: 'B', path: '/b.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 100 },  // medium (100-299)
      { id: 'C', name: 'C', path: '/c.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 300 },  // high (300-499)
      { id: 'D', name: 'D', path: '/d.tsx', type: 'react', dependencies: [], dependents: [], lineCount: 500 },  // critical (500+)
    ];
    
    const metrics = await calculateBlastRadius(graph, components);
    
    expect(metrics.get('A')!.level).toBe('low');
    expect(metrics.get('B')!.level).toBe('medium');
    expect(metrics.get('C')!.level).toBe('high');
    expect(metrics.get('D')!.level).toBe('critical');
  });
});
