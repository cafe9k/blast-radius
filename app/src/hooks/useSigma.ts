import { useEffect, useRef, useCallback } from 'react';
import Sigma from 'sigma';
import type Graph from 'graphology';
import type { CameraState } from 'sigma/types';

export interface ZoomControls {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToView: () => void;
}

export function useSigma(
  graph: Graph | null,
  containerRef: React.RefObject<HTMLDivElement>,
  onNodeClick?: (nodeId: string) => void
) {
  const rendererRef = useRef<Sigma | null>(null);
  const onNodeClickRef = useRef(onNodeClick);
  const initialCameraStateRef = useRef<CameraState | null>(null);

  // Keep ref updated
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Highlight node and its dependency chain
  const highlightNode = useCallback((nodeId: string | null) => {
    const renderer = rendererRef.current;
    const g = graph;
    if (!renderer || !g) return;

    if (nodeId === null) {
      // Reset all nodes and edges to original state
      g.forEachNode((node) => {
        const originalColor = g.getNodeAttribute(node, 'originalColor');
        g.setNodeAttribute(node, 'color', originalColor);
        g.setNodeAttribute(node, 'highlighted', false);
        g.setNodeAttribute(node, 'hidden', false);
      });
      
      g.forEachEdge((edge) => {
        g.setEdgeAttribute(edge, 'color', 'rgba(148, 163, 184, 0.12)');
        g.setEdgeAttribute(edge, 'highlighted', false);
        g.setEdgeAttribute(edge, 'hidden', false);
      });
    } else {
      // Get all neighbors (upstream and downstream)
      const neighbors = new Set<string>();
      neighbors.add(nodeId);
      
      // Downstream dependencies (nodes this node depends on)
      g.forEachOutNeighbor(nodeId, (neighbor) => {
        neighbors.add(neighbor);
      });
      
      // Upstream dependencies (nodes that depend on this node)
      g.forEachInNeighbor(nodeId, (neighbor) => {
        neighbors.add(neighbor);
      });

      // Fade all nodes not in the dependency chain
      g.forEachNode((node) => {
        const originalColor = g.getNodeAttribute(node, 'originalColor');
        if (neighbors.has(node)) {
          g.setNodeAttribute(node, 'color', originalColor);
          g.setNodeAttribute(node, 'highlighted', node === nodeId);
          g.setNodeAttribute(node, 'hidden', false);
        } else {
          g.setNodeAttribute(node, 'color', `${originalColor}33`); // Add transparency
          g.setNodeAttribute(node, 'highlighted', false);
          g.setNodeAttribute(node, 'hidden', true);
        }
      });

      // Highlight edges in the dependency chain
      g.forEachEdge((edge, { source, target }) => {
        if (neighbors.has(source) && neighbors.has(target)) {
          g.setEdgeAttribute(edge, 'color', '#58a6ff'); // GitHub accent blue
          g.setEdgeAttribute(edge, 'highlighted', true);
          g.setEdgeAttribute(edge, 'size', 1.5);
        } else {
          g.setEdgeAttribute(edge, 'color', 'rgba(148, 163, 184, 0.05)');
          g.setEdgeAttribute(edge, 'highlighted', false);
          g.setEdgeAttribute(edge, 'size', 0.2);
        }
      });
    }

    renderer.refresh();
  }, [graph]);

  // Zoom controls
  const zoomControls: ZoomControls = {
    zoomIn: useCallback(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const camera = renderer.getCamera();
      camera.animatedZoom({ duration: 300 });
    }, []),

    zoomOut: useCallback(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const camera = renderer.getCamera();
      camera.animatedUnzoom({ duration: 300 });
    }, []),

    resetZoom: useCallback(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const camera = renderer.getCamera();
      if (initialCameraStateRef.current) {
        camera.setState(initialCameraStateRef.current);
      }
    }, []),

    fitToView: useCallback(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      renderer.getCamera().animatedReset({ duration: 500 });
    }, []),
  };

  useEffect(() => {
    if (!graph || !containerRef.current) return;

    // Clean up previous renderer
    if (rendererRef.current) {
      rendererRef.current.kill();
    }

    // Create new renderer
    const renderer = new Sigma(graph, containerRef.current, {
      labelRenderedSizeThreshold: 6,
      labelFont: 'JetBrains Mono',
      labelSize: 12,
      labelColor: { color: '#e6edf3' }, // GitHub fg.default
      defaultNodeColor: '#58a6ff', // GitHub accent blue
      defaultEdgeColor: 'rgba(148, 163, 184, 0.12)',
      edgeLabelFont: 'JetBrains Mono',
      renderEdgeLabels: false,
      hideEdgesOnMove: false,
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      nodeReducer: (node, data) => {
        const res = { ...data };
        if (data.hidden) {
          res.label = '';
        }
        if (data.inCycle && !data.hidden) {
          res.borderColor = '#f85149'; // GitHub danger red
          res.borderSize = 2;
        }
        return res;
      },
      edgeReducer: (edge, data) => {
        return { ...data };
      },
    });

    // Store initial camera state
    initialCameraStateRef.current = renderer.getCamera().getState();

    // Handle node click
    renderer.on('clickNode', ({ node }) => {
      onNodeClickRef.current?.(node);
    });

    // Handle stage click (deselect)
    renderer.on('clickStage', () => {
      highlightNode(null);
    });

    rendererRef.current = renderer;

    return () => {
      renderer.kill();
      rendererRef.current = null;
    };
  }, [graph, containerRef, highlightNode]);

  return { rendererRef, highlightNode, zoomControls };
}
