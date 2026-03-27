import { describe, it, expect } from 'vitest';
import { buildDependencyGraph, findCircularDependencies } from '../src/analyzer/graph-builder.js';
import type { ComponentNode } from '../src/types/component.js';

describe('Graph Builder', () => {
  it('should build graph from components', async () => {
    const components: ComponentNode[] = [
      {
        id: 'comp-a',
        name: 'ComponentA',
        path: '/src/ComponentA.tsx',
        type: 'react',
        dependencies: ['comp-b'],
        dependents: [],
      },
      {
        id: 'comp-b',
        name: 'ComponentB',
        path: '/src/ComponentB.tsx',
        type: 'react',
        dependencies: [],
        dependents: ['comp-a'],
      },
    ];
    
    const graph = await buildDependencyGraph(components, '/project');
    
    expect(graph.order).toBe(2);
    expect(graph.size).toBe(1);
    expect(graph.hasNode('comp-a')).toBe(true);
    expect(graph.hasNode('comp-b')).toBe(true);
  });
  
  it('should detect circular dependencies', async () => {
    const components: ComponentNode[] = [
      {
        id: 'a',
        name: 'A',
        path: '/a.tsx',
        type: 'react',
        dependencies: ['b'],
        dependents: [],
      },
      {
        id: 'b',
        name: 'B',
        path: '/b.tsx',
        type: 'react',
        dependencies: ['a'],
        dependents: [],
      },
    ];
    
    const graph = await buildDependencyGraph(components, '/project');
    const cycles = findCircularDependencies(graph);
    
    expect(cycles.length).toBeGreaterThan(0);
  });
});
