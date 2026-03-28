import { useRef } from 'react';
import type { AnalysisData, ColorMode } from '../../types';
import { useGraph } from '../../hooks/useGraph';
import { useSigma } from '../../hooks/useSigma';

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
  
  useSigma(graph, containerRef, onComponentSelect);
  
  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      
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
      </div>
      
      {/* Instructions */}
      {!selectedComponent && (
        <div className="absolute top-4 right-4 glass rounded-lg p-3 border border-white/10 animate-fade-in">
          <p className="text-xs text-text-tertiary">
            Click a node to view details
          </p>
        </div>
      )}
    </div>
  );
}
