import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import type { ZoomControls } from '../../hooks/useSigma';

interface ZoomControlsProps {
  controls: ZoomControls;
}

export default function ZoomControlsPanel({ controls }: ZoomControlsProps) {
  return (
    <div className="flex flex-col gap-1 glass rounded-lg p-1 border border-white/10">
      <button
        onClick={controls.zoomIn}
        className="p-2 rounded hover:bg-white/10 transition-colors group"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
      </button>
      <button
        onClick={controls.zoomOut}
        className="p-2 rounded hover:bg-white/10 transition-colors group"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
      </button>
      <button
        onClick={controls.fitToView}
        className="p-2 rounded hover:bg-white/10 transition-colors group"
        title="Fit to View"
      >
        <Maximize2 className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
      </button>
      <button
        onClick={controls.resetZoom}
        className="p-2 rounded hover:bg-white/10 transition-colors group"
        title="Reset View"
      >
        <RotateCcw className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
      </button>
    </div>
  );
}
