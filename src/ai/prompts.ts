import type Graph from 'graphology';
import type { ComponentNode } from '../types/component.js';
import type { BlastRadiusMetrics } from '../types/graph.js';

export function generateAnalysisPrompt(
  graph: Graph,
  components: ComponentNode[],
  metrics: Map<string, BlastRadiusMetrics>
): string {
  // Get graph statistics
  const nodeCount = graph.order;
  const edgeCount = graph.size;
  const avgFanIn = Array.from(metrics.values()).reduce((sum, m) => sum + m.fanIn, 0) / metrics.size;
  const avgFanOut = Array.from(metrics.values()).reduce((sum, m) => sum + m.fanOut, 0) / metrics.size;
  
  // Get risk distribution
  const riskDist = {
    critical: Array.from(metrics.values()).filter(m => m.level === 'critical').length,
    high: Array.from(metrics.values()).filter(m => m.level === 'high').length,
    medium: Array.from(metrics.values()).filter(m => m.level === 'medium').length,
    low: Array.from(metrics.values()).filter(m => m.level === 'low').length,
  };
  
  // Get top risk components
  const topRisk = Array.from(metrics.values())
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
    .map(m => {
      const comp = components.find(c => c.id === m.componentId);
      return `- ${comp?.name || m.componentId} (Score: ${m.riskScore}, Level: ${m.level}, Fan-In: ${m.fanIn}, Breadth: ${m.breadth})`;
    })
    .join('\n');
  
  return `
Analyze the following React component dependency graph and provide insights on architecture quality, risks, and refactoring suggestions.

**Project Statistics:**
- Total Components: ${nodeCount}
- Total Dependencies: ${edgeCount}
- Average Fan-In: ${avgFanIn.toFixed(2)}
- Average Fan-Out: ${avgFanOut.toFixed(2)}

**Risk Distribution:**
- Critical: ${riskDist.critical} components
- High: ${riskDist.high} components
- Medium: ${riskDist.medium} components
- Low: ${riskDist.low} components

**Top 10 High-Risk Components:**
${topRisk}

**Analysis Tasks:**
1. Identify architectural risks and anti-patterns
2. Highlight components that are critical to system stability
3. Suggest refactoring opportunities to reduce coupling
4. Recommend best practices for improving maintainability

Please provide:
1. A brief summary (2-3 sentences)
2. Top 3-5 specific risks (be specific about component names and issues)
3. Top 3-5 actionable suggestions for improvement

Format your response as JSON:
{
  "summary": "...",
  "risks": ["risk1", "risk2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...]
}
`;
}

export function parseAnalysisResponse(response: string): {
  summary: string;
  risks: string[];
  suggestions: string[];
} {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error);
  }
  
  // Fallback: parse as plain text
  const lines = response.split('\n').filter(l => l.trim());
  return {
    summary: lines[0] || 'Analysis completed',
    risks: lines.filter(l => l.includes('risk') || l.includes('Risk')).slice(0, 5),
    suggestions: lines.filter(l => l.includes('suggest') || l.includes('recommend')).slice(0, 5),
  };
}
