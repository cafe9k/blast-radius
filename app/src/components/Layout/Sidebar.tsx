import { useState } from 'react';
import type { AnalysisData } from '../../types';
import { cn } from '../../App';

interface SidebarProps {
  data: AnalysisData;
  riskFilter: string;
  onRiskFilterChange: (filter: string) => void;
  onComponentSelect: (id: string) => void;
  selectedComponent: string | null;
}

export default function Sidebar({
  data,
  riskFilter,
  onRiskFilterChange,
  onComponentSelect,
  selectedComponent,
}: SidebarProps) {
  const riskDistribution = {
    low: data.metrics.filter(m => m.level === 'low').length,
    medium: data.metrics.filter(m => m.level === 'medium').length,
    high: data.metrics.filter(m => m.level === 'high').length,
    critical: data.metrics.filter(m => m.level === 'critical').length,
  };
  
  const topRiskComponents = data.metrics
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);
  
  const totalDependencies = data.components.reduce((sum, c) => sum + c.dependencies.length, 0);
  
  return (
    <aside className="w-72 glass border-r border-white/10 flex flex-col overflow-hidden">
      {/* Stats Overview */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Statistics</h2>
        
        <div className="space-y-3">
          <div className="bg-background-dark/50 rounded-lg p-3 border border-white/5">
            <div className="text-2xl font-bold text-primary-cyan">{data.project.componentCount}</div>
            <div className="text-xs text-text-tertiary mt-1">Total Components</div>
          </div>
          
          <div className="bg-background-dark/50 rounded-lg p-3 border border-white/5">
            <div className="text-2xl font-bold text-primary-purple">{totalDependencies}</div>
            <div className="text-xs text-text-tertiary mt-1">Total Dependencies</div>
          </div>
        </div>
      </div>
      
      {/* Risk Distribution */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Risk Distribution</h2>
        
        <div className="space-y-2">
          {(['critical', 'high', 'medium', 'low'] as const).map(level => (
            <button
              key={level}
              onClick={() => onRiskFilterChange(riskFilter === level ? 'all' : level)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                riskFilter === level
                  ? 'bg-primary-cyan/20 border border-primary-cyan/50'
                  : 'bg-background-dark/30 border border-white/5 hover:border-white/20'
              )}
            >
              <span className="text-sm capitalize text-text-primary">{level}</span>
              <span className={cn(
                'text-sm font-semibold',
                level === 'critical' && 'text-risk-critical',
                level === 'high' && 'text-risk-high',
                level === 'medium' && 'text-risk-medium',
                level === 'low' && 'text-risk-low',
              )}>
                {riskDistribution[level]}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Top Risk Components */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Top Risk Components</h2>
        
        <div className="space-y-2">
          {topRiskComponents.map((metric, index) => {
            const component = data.components.find(c => c.id === metric.componentId);
            if (!component) return null;
            
            return (
              <button
                key={metric.componentId}
                onClick={() => onComponentSelect(metric.componentId)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg transition-colors',
                  selectedComponent === metric.componentId
                    ? 'bg-primary-cyan/20 border border-primary-cyan/50'
                    : 'bg-background-dark/30 border border-white/5 hover:border-white/20'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary truncate">{component.name}</span>
                  <span className={cn(
                    'text-xs font-semibold',
                    metric.level === 'critical' && 'text-risk-critical',
                    metric.level === 'high' && 'text-risk-high',
                    metric.level === 'medium' && 'text-risk-medium',
                    metric.level === 'low' && 'text-risk-low',
                  )}>
                    {metric.riskScore}
                  </span>
                </div>
                <div className="text-xs text-text-tertiary truncate">{component.path}</div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
