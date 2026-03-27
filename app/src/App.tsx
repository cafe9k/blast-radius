import { useState, useEffect } from 'react';
import type { AnalysisData } from './types';
import { useData } from './hooks/useData';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import GraphCanvas from './components/Graph/GraphCanvas';
import DetailPanel from './components/Layout/DetailPanel';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const { data, loading, error } = useData();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-dark">
        <div className="text-center text-risk-critical">
          <p className="text-xl font-semibold mb-2">Error Loading Data</p>
          <p className="text-text-secondary">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background-dark overflow-hidden">
      {/* Header */}
      <Header
        projectName={data.project.name}
        analyzedAt={data.project.analyzedAt}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          data={data}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          onComponentSelect={setSelectedComponent}
          selectedComponent={selectedComponent}
        />
        
        {/* Graph Canvas */}
        <div className="flex-1 relative">
          <GraphCanvas
            data={data}
            searchQuery={searchQuery}
            riskFilter={riskFilter}
            selectedComponent={selectedComponent}
            onComponentSelect={setSelectedComponent}
          />
        </div>
        
        {/* Detail Panel */}
        <DetailPanel
          data={data}
          selectedComponent={selectedComponent}
          onClose={() => setSelectedComponent(null)}
        />
      </div>
    </div>
  );
}

export default App;
