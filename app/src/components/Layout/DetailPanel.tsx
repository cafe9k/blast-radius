import { X, GitBranch, AlertTriangle, Lightbulb, Code } from 'lucide-react';
import type { AnalysisData } from '../../types';
import { cn } from '../../App';

interface DetailPanelProps {
  data: AnalysisData;
  selectedComponent: string | null;
  onClose: () => void;
}

export default function DetailPanel({ data, selectedComponent, onClose }: DetailPanelProps) {
  if (!selectedComponent) {
    return (
      <aside className="w-80 glass border-l border-white/10 flex items-center justify-center">
        <p className="text-text-tertiary text-sm">Select a component to view details</p>
      </aside>
    );
  }
  
  const component = data.components.find(c => c.id === selectedComponent);
  const metrics = data.metrics.find(m => m.componentId === selectedComponent);
  
  if (!component || !metrics) {
    return null;
  }
  
  return (
    <aside className="w-96 glass border-l border-white/10 flex flex-col overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{component.name}</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Path */}
        <div>
          <div className="text-xs text-text-tertiary mb-1">File Path</div>
          <code className="text-xs bg-background-dark/50 px-2 py-1 rounded border border-white/10 text-primary-cyan">
            {component.path}
          </code>
        </div>
        
        {/* Metrics */}
        <div>
          <div className="text-xs text-text-tertiary mb-3">Metrics</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background-dark/50 rounded-lg p-3 border border-white/10">
              <div className="text-xl font-bold text-primary-cyan">{component.lineCount || 0}</div>
              <div className="text-xs text-text-tertiary mt-1">Lines of Code</div>
            </div>
            <div className="bg-background-dark/50 rounded-lg p-3 border border-white/10">
              <div className="text-xl font-bold text-primary-purple">{component.dependencies.length}</div>
              <div className="text-xs text-text-tertiary mt-1">Dependencies</div>
            </div>
            <div className="bg-background-dark/50 rounded-lg p-3 border border-white/10">
              <div className="text-xl font-bold text-primary-green">{component.dependents.length}</div>
              <div className="text-xs text-text-tertiary mt-1">Dependents</div>
            </div>
            <div className="bg-background-dark/50 rounded-lg p-3 border border-white/10">
              <div className="text-xl font-bold text-risk-high">{(component.exports || []).length}</div>
              <div className="text-xs text-text-tertiary mt-1">Exports</div>
            </div>
          </div>
        </div>
        
        {/* Risk Score */}
        <div>
          <div className="text-xs text-text-tertiary mb-2">Lines of Code (Risk Score)</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-background-dark rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  metrics.level === 'critical' && 'bg-risk-critical',
                  metrics.level === 'high' && 'bg-risk-high',
                  metrics.level === 'medium' && 'bg-risk-medium',
                  metrics.level === 'low' && 'bg-risk-low',
                )}
                style={{ width: `${Math.min(100, (metrics.riskScore / 500) * 100)}%` }}
              />
            </div>
            <span className={cn(
              'text-lg font-bold',
              metrics.level === 'critical' && 'text-risk-critical',
              metrics.level === 'high' && 'text-risk-high',
              metrics.level === 'medium' && 'text-risk-medium',
              metrics.level === 'low' && 'text-risk-low',
            )}>
              {metrics.lineCount}
            </span>
          </div>
        </div>
        
        {/* Dependencies */}
        {component.dependencies.length > 0 && (
          <div>
            <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              Dependencies ({component.dependencies.length})
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {component.dependencies.slice(0, 10).map(depId => {
                const dep = data.components.find(c => c.id === depId);
                return (
                  <div
                    key={depId}
                    className="text-xs bg-background-dark/50 px-2 py-1 rounded border border-white/10 text-text-primary"
                  >
                    {dep?.name || depId}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* AI Insights */}
        {data.aiInsights && (
          <div className="space-y-4">
            {data.aiInsights.risks.length > 0 && (
              <div>
                <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Risks
                </div>
                <ul className="space-y-1">
                  {data.aiInsights.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-text-secondary">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.aiInsights.suggestions.length > 0 && (
              <div>
                <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Suggestions
                </div>
                <ul className="space-y-1">
                  {data.aiInsights.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-xs text-text-secondary">• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
