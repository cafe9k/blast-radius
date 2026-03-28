import { useEffect, useRef } from 'react';
import Sigma from 'sigma';
import type Graph from 'graphology';

export function useSigma(
  graph: Graph | null,
  containerRef: React.RefObject<HTMLDivElement>,
  onNodeClick?: (nodeId: string) => void
) {
  const rendererRef = useRef<Sigma | null>(null);
  const onNodeClickRef = useRef(onNodeClick);

  // Keep ref updated
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

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
      labelColor: { color: '#E2E8F0' },
      defaultNodeColor: '#00D9FF',
      defaultEdgeColor: 'rgba(0, 217, 255, 0.3)',
      edgeLabelFont: 'JetBrains Mono',
      renderEdgeLabels: false,
      hideEdgesOnMove: false,
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
    });

    // Handle node click
    renderer.on('clickNode', ({ node }) => {
      onNodeClickRef.current?.(node);
    });

    rendererRef.current = renderer;

    return () => {
      renderer.kill();
      rendererRef.current = null;
    };
  }, [graph, containerRef]); // Remove onNodeClick from dependencies

  return rendererRef;
}
