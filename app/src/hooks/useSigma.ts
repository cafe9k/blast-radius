import { useEffect, useRef, useCallback, useState } from 'react';
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
  onNodeClick?: (nodeId: string | null) => void
) {
  const rendererRef = useRef<Sigma | null>(null);
  const onNodeClickRef = useRef(onNodeClick);
  const initialCameraStateRef = useRef<CameraState | null>(null);
  const lastHighlightedNodeRef = useRef<string | null>(null);
  const highlightRAFRef = useRef<number>();

  // Processing state for visual feedback
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep ref updated
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Reset a single node and its neighbors
  const resetNodeAndNeighbors = useCallback((nodeId: string, g: Graph) => {
    const nodes = new Set<string>();
    nodes.add(nodeId);
    
    g.forEachOutNeighbor(nodeId, (n) => nodes.add(n));
    g.forEachInNeighbor(nodeId, (n) => nodes.add(n));

    nodes.forEach(node => {
      if (!g.hasNode(node)) return;
      const originalColor = g.getNodeAttribute(node, 'originalColor');
      g.setNodeAttribute(node, 'color', originalColor);
      g.setNodeAttribute(node, 'highlighted', false);
      g.setNodeAttribute(node, 'hidden', false);
    });

    // Reset edges connected to these nodes
    g.forEachEdge((edge, { source, target }) => {
      if (nodes.has(source) || nodes.has(target)) {
        g.setEdgeAttribute(edge, 'color', 'rgba(148, 163, 184, 0.12)');
        g.setEdgeAttribute(edge, 'highlighted', false);
        g.setEdgeAttribute(edge, 'hidden', false);
        g.setEdgeAttribute(edge, 'size', 0.3);
      }
    });
  }, []);

  // Highlight node and its dependency chain (optimized)
  const highlightNode = useCallback((nodeId: string | null) => {
    const renderer = rendererRef.current;
    const g = graph;
    if (!renderer || !g) return;

    // Cancel any pending highlight
    if (highlightRAFRef.current) {
      cancelAnimationFrame(highlightRAFRef.current);
    }

    // Use requestAnimationFrame for smooth UI
    highlightRAFRef.current = requestAnimationFrame(() => {
      const lastHighlighted = lastHighlightedNodeRef.current;

      // Full restore when clearing selection (was only resetting previous ball — left distant nodes stuck hidden)
      if (nodeId === null) {
        lastHighlightedNodeRef.current = null;
        g.forEachNode((node) => {
          if (!g.hasNode(node)) return;
          const originalColor = g.getNodeAttribute(node, 'originalColor');
          g.setNodeAttribute(node, 'color', originalColor);
          g.setNodeAttribute(node, 'highlighted', false);
          g.setNodeAttribute(node, 'hidden', false);
        });
        g.forEachEdge((edge) => {
          g.setEdgeAttribute(edge, 'color', 'rgba(148, 163, 184, 0.12)');
          g.setEdgeAttribute(edge, 'highlighted', false);
          g.setEdgeAttribute(edge, 'hidden', false);
          g.setEdgeAttribute(edge, 'size', 0.3);
        });
        renderer.refresh();
        return;
      }

      // Clear previous highlight efficiently
      if (lastHighlighted) {
        resetNodeAndNeighbors(lastHighlighted, g);
      }

      // Check if node exists
      if (!g.hasNode(nodeId)) {
        console.warn(`Node ${nodeId} not found in graph`);
        lastHighlightedNodeRef.current = null;
        renderer.refresh();
        return;
      }

      // Get all neighbors (upstream and downstream)
      const neighbors = new Set<string>();
      neighbors.add(nodeId);
      
      g.forEachOutNeighbor(nodeId, (neighbor) => neighbors.add(neighbor));
      g.forEachInNeighbor(nodeId, (neighbor) => neighbors.add(neighbor));

      // Only update affected nodes
      neighbors.forEach(node => {
        if (!g.hasNode(node)) return;
        const originalColor = g.getNodeAttribute(node, 'originalColor');
        g.setNodeAttribute(node, 'color', originalColor);
        g.setNodeAttribute(node, 'highlighted', node === nodeId);
        g.setNodeAttribute(node, 'hidden', false);
      });

      // Always dim non-neighbors (switching A→B used to skip this when lastHighlighted was set, leaving wrong visibility)
      g.forEachNode((node) => {
        if (!neighbors.has(node)) {
          const originalColor = g.getNodeAttribute(node, 'originalColor');
          g.setNodeAttribute(node, 'color', `${originalColor}33`);
          g.setNodeAttribute(node, 'highlighted', false);
          g.setNodeAttribute(node, 'hidden', true);
        }
      });

      // Highlight edges in the dependency chain
      g.forEachEdge((edge, { source, target }) => {
        if (neighbors.has(source) && neighbors.has(target)) {
          g.setEdgeAttribute(edge, 'color', '#58a6ff');
          g.setEdgeAttribute(edge, 'highlighted', true);
          g.setEdgeAttribute(edge, 'size', 1.5);
        } else {
          g.setEdgeAttribute(edge, 'color', 'rgba(148, 163, 184, 0.05)');
          g.setEdgeAttribute(edge, 'highlighted', false);
          g.setEdgeAttribute(edge, 'size', 0.2);
        }
      });

      lastHighlightedNodeRef.current = nodeId;
      renderer.refresh();
    });
  }, [graph, resetNodeAndNeighbors]);

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
      // Default is 3: a few mousemove events while mousedown suppress click entirely (feels like dead clicks)
      draggedEventsTolerance: 24,
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      nodeReducer: (_node, data) => {
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
      edgeReducer: (_edge, data) => {
        return { ...data };
      },
    });

    // Store initial camera state
    initialCameraStateRef.current = renderer.getCamera().getState();

    // Handle node click - directly highlight for immediate feedback
    renderer.on('clickNode', ({ node }) => {
      setIsProcessing(true);
      highlightNode(node); // Direct highlight for instant feedback
      onNodeClickRef.current?.(node); // Then notify parent
      setTimeout(() => setIsProcessing(false), 100);
    });

    // Handle stage click (deselect)
    renderer.on('clickStage', () => {
      setIsProcessing(true);
      highlightNode(null);
      onNodeClickRef.current?.(null);
      setTimeout(() => setIsProcessing(false), 100);
    });

    // Handle node hover for better UX
    renderer.on('enterNode', () => {
      document.body.style.cursor = 'pointer';
    });

    renderer.on('leaveNode', () => {
      document.body.style.cursor = 'default';
    });

    rendererRef.current = renderer;

    return () => {
      if (highlightRAFRef.current) {
        cancelAnimationFrame(highlightRAFRef.current);
      }
      renderer.kill();
      rendererRef.current = null;
      lastHighlightedNodeRef.current = null;
    };
  }, [graph, containerRef, highlightNode]);

  return { rendererRef, highlightNode, zoomControls, isProcessing };
}
