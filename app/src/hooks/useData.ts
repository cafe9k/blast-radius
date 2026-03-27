import { useState, useEffect } from 'react';
import type { AnalysisData } from '../types';

export function useData() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check for injected data from CLI
        const injectedData = (window as any).__BLAST_RADIUS_DATA__;
        
        if (injectedData) {
          setData(injectedData);
          setLoading(false);
          return;
        }
        
        // Fallback: load from data.json (development mode)
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error('Failed to load analysis data');
        }
        
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return { data, loading, error };
}
