import type { AnalysisResult } from '../types';

/**
 * Serialize analysis result for JSON output
 * Converts Map to array for JSON compatibility
 */
export function serializeResult(result: AnalysisResult): any {
  return {
    project: result.project,
    components: result.components,
    metrics: Array.from(result.metrics.entries()).map(([key, value]) => ({
      ...value,
    })),
    aiInsights: result.aiInsights,
  };
}
