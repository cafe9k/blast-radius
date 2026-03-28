import { useRef, useEffect } from 'react';
import type { AnalysisData, ColorMode } from '../../types';
import { useGraph } from '../../hooks/useGraph';
import { useSigma } from '../../hooks/useSigma';
import ZoomControlsPanel from './ZoomControls';

interface GraphCanvasProps {
  data: AnalysisData;
  searchQuery: string;
  riskFilter: string;
  selectedComponent: string | null;
  onComponentSelect: (id: string) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
}

export default function GraphCanvas({
  data,
  searchQuery,
  riskFilter,
  selectedComponent,
  onComponentSelect,
  colorMode,
  onColorModeChange,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const graph = useGraph(data, searchQuery, riskFilter, colorMode);
  
  const { highlightNode, zoomControls } = useSigma(graph, containerRef, onComponentSelect);

  // Highlight selected node's dependency chain
  useEffect(() => {
    highlightNode(selectedComponent);
  }, [selectedComponent, highlightNode]);

  // Count nodes with cycles
  const cycleCount = graph 
    ? graph.filterNodes((_, attrs) => attrs.inCycle).length 
    : 0;
  
  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4">
        <ZoomControlsPanel controls={zoomControls} />
      </div>
      
      {/* Cycle Warning */}
      {cycleCount > 0 && (
        <div className="absolute top-4 left-20 glass rounded-lg p-3 border border-risk-critical/50 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-risk-critical animate-pulse" />
            <span className="text-xs text-risk-critical font-medium">
              {cycleCount} node{cycleCount > 1 ? 's' : ''} in circular dependencies
            </span>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-lg p-3 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-tertiary">Color Mode</span>
          <div className="flex gap-1">
            <button
              onClick={() => onColorModeChange('risk')}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                colorMode === 'risk' 
                  ? 'bg-primary-cyan/20 text-primary-cyan' 
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Risk
            </button>
            <button
              onClick={() => onColorModeChange('community')}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                colorMode === 'community' 
                  ? 'bg-primary-cyan/20 text-primary-cyan' 
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Community
            </button>
          </div>
        </div>
        
        {colorMode === 'risk' ? (
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-risk-low" />
              <span className="text-xs text-text-secondary">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-risk-medium" />
              <span className="text-xs text-text-secondary">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-risk-high" />
              <span className="text-xs text-text-secondary">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-risk-critical" />
              <span className="text-xs text-text-secondary">Critical</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-text-tertiary">
            Colors indicate functional groupings
          </div>
        )}
        
        {/* Cycle indicator in legend */}
        {cycleCount > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-risk-critical bg-transparent" />
              <span className="text-xs text-text-secondary">Circular dependency</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      {!selectedComponent && (
        <div className="absolute top-4 right-4 glass rounded-lg p-3 border border-white/10 animate-fade-in">
          <p className="text-xs text-text-tertiary">
            Click a node to view details & highlight dependencies
          </p>
        </div>
      )}
    </div>
  );
}
