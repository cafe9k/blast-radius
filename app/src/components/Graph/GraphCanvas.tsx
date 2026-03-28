import { useRef, useEffect, useState } from 'react';
import type { AnalysisData, ColorMode } from '../../types';
import { useGraph, LayoutType } from '../../hooks/useGraph';
import { useSigma } from '../../hooks/useSigma';
import { 
  Maximize2, Minimize2, Network, Circle, Shuffle,
  ZoomIn, ZoomOut, RotateCcw, Maximize2 as FitView,
  AlertTriangle, Info
} from 'lucide-react';
import { cn } from '../../App';

interface GraphCanvasProps {
  data: AnalysisData;
  searchQuery: string;
  riskFilter: string;
  selectedComponent: string | null;
  onComponentSelect: (id: string) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
}

const LAYOUT_OPTIONS: { type: LayoutType; label: string; icon: React.ReactNode }[] = [
  { type: 'force', label: 'Force Layout', icon: <Network className="w-4 h-4" /> },
  { type: 'circular', label: 'Circular Layout', icon: <Circle className="w-4 h-4" /> },
  { type: 'random', label: 'Random Layout', icon: <Shuffle className="w-4 h-4" /> },
];

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
  const [layoutType, setLayoutType] = useState<LayoutType>('force');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const graph = useGraph(data, searchQuery, riskFilter, colorMode, layoutType);
  
  const { highlightNode, zoomControls } = useSigma(graph, containerRef, onComponentSelect);

  // Highlight selected node's dependency chain
  useEffect(() => {
    highlightNode(selectedComponent);
  }, [selectedComponent, highlightNode]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current?.parentElement;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Count nodes with cycles
  const cycleCount = graph 
    ? graph.filterNodes((_, attrs) => attrs.inCycle).length 
    : 0;
  
  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* ========== LEFT SIDE: Controls ========== */}
      
      {/* Main Control Panel - Top Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        {/* View Controls */}
        <div className="glass rounded-lg border border-white/10 shadow-lg flex flex-col">
          <button
            onClick={zoomControls.zoomIn}
            className="p-2.5 hover:bg-white/10 transition-colors rounded-t-lg group border-b border-white/5"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
          </button>
          <button
            onClick={zoomControls.zoomOut}
            className="p-2.5 hover:bg-white/10 transition-colors group border-b border-white/5"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
          </button>
          <button
            onClick={zoomControls.fitToView}
            className="p-2.5 hover:bg-white/10 transition-colors group border-b border-white/5"
            title="Fit to View"
          >
            <FitView className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
          </button>
          <button
            onClick={zoomControls.resetZoom}
            className="p-2.5 hover:bg-white/10 transition-colors rounded-b-lg group"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
          </button>
        </div>
        
        {/* Layout Controls */}
        <div className="glass rounded-lg border border-white/10 shadow-lg flex flex-col">
          {LAYOUT_OPTIONS.map((option, index) => (
            <button
              key={option.type}
              onClick={() => setLayoutType(option.type)}
              className={cn(
                'p-2.5 transition-all group',
                index === 0 && 'rounded-t-lg border-b border-white/5',
                index === 1 && 'border-b border-white/5',
                index === LAYOUT_OPTIONS.length - 1 && 'rounded-b-lg',
                layoutType === option.type
                  ? 'bg-primary-cyan/20 text-primary-cyan'
                  : 'text-text-secondary hover:bg-white/10'
              )}
              title={option.label}
            >
              <span className={cn(
                'transition-colors',
                layoutType === option.type 
                  ? 'text-primary-cyan' 
                  : 'group-hover:text-primary-cyan'
              )}>
                {option.icon}
              </span>
            </button>
          ))}
        </div>
        
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="glass rounded-lg p-2.5 border border-white/10 shadow-lg hover:border-primary-cyan/50 transition-all group"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
          ) : (
            <Maximize2 className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
          )}
        </button>
      </div>
      
      {/* ========== RIGHT SIDE: Status & Actions ========== */}
      
      {/* Top Right - Cycle Warning */}
      {cycleCount > 0 && (
        <div className="absolute top-4 right-4 z-10 animate-fade-in">
          <div className="glass rounded-lg px-3 py-2 border border-risk-critical/50 shadow-lg bg-risk-critical/5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-risk-critical" />
            <span className="text-xs text-risk-critical font-medium">
              {cycleCount} Circular {cycleCount > 1 ? 'Dependencies' : 'Dependency'}
            </span>
          </div>
        </div>
      )}
      
      {/* ========== BOTTOM: Legends & Info ========== */}
      
      {/* Bottom Left - Color Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="glass rounded-lg p-3 border border-white/10 shadow-lg">
          {/* Color Mode Toggle */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Color</span>
            <div className="flex gap-0.5 bg-background-dark/50 rounded-md p-0.5">
              <button
                onClick={() => onColorModeChange('risk')}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded transition-all',
                  colorMode === 'risk' 
                    ? 'bg-primary-cyan/20 text-primary-cyan' 
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
                title="Color by Risk Level"
              >
                Risk
              </button>
              <button
                onClick={() => onColorModeChange('community')}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded transition-all',
                  colorMode === 'community' 
                    ? 'bg-primary-cyan/20 text-primary-cyan' 
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
                title="Color by Community"
              >
                Community
              </button>
            </div>
          </div>
          
          {/* Color Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {colorMode === 'risk' ? (
              <>
                <div className="flex items-center gap-1" title="Low Risk (0-39)">
                  <div className="w-2.5 h-2.5 rounded-full bg-risk-low" />
                  <span className="text-[10px] text-text-secondary">Low</span>
                </div>
                <div className="flex items-center gap-1" title="Medium Risk (40-59)">
                  <div className="w-2.5 h-2.5 rounded-full bg-risk-medium" />
                  <span className="text-[10px] text-text-secondary">Med</span>
                </div>
                <div className="flex items-center gap-1" title="High Risk (60-79)">
                  <div className="w-2.5 h-2.5 rounded-full bg-risk-high" />
                  <span className="text-[10px] text-text-secondary">High</span>
                </div>
                <div className="flex items-center gap-1" title="Critical Risk (80-100)">
                  <div className="w-2.5 h-2.5 rounded-full bg-risk-critical" />
                  <span className="text-[10px] text-text-secondary">Crit</span>
                </div>
              </>
            ) : (
              <span className="text-[10px] text-text-tertiary">
                Colors = functional groupings
              </span>
            )}
          </div>
          
          {/* Cycle indicator */}
          {cycleCount > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-risk-critical bg-transparent" />
              <span className="text-[10px] text-text-secondary">Circular dep</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Right - Help Tip */}
      {!selectedComponent && !isFullscreen && (
        <div className="absolute bottom-4 right-4 z-10 animate-fade-in">
          <div className="glass rounded-lg px-2.5 py-1.5 border border-white/10 shadow-lg flex items-center gap-1.5">
            <Info className="w-3 h-3 text-text-tertiary" />
            <p className="text-[10px] text-text-tertiary">
              Click node to highlight dependencies
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
