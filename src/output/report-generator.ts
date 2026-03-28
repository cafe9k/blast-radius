import fs from 'fs-extra';
import path from 'path';
import type { AnalysisResult } from '../types';
import { generateJSONReport } from './json-generator';
import { generateHTMLReport } from './html-generator';

export interface ReportOptions {
  format: ('html' | 'json')[];
  outputPath: string;
}

/**
 * Generate analysis report in specified formats
 * Coordinates JSON and HTML report generation
 */
export async function generateReport(
  result: AnalysisResult,
  options: ReportOptions
): Promise<string> {
  const outputDir = path.dirname(options.outputPath);
  await fs.ensureDir(outputDir);
  
  // Generate JSON report
  if (options.format.includes('json')) {
    const jsonPath = options.outputPath.replace('.html', '.json');
    await generateJSONReport(result, jsonPath);
  }
  
  // Generate HTML report
  if (options.format.includes('html')) {
    await generateHTMLReport(result, options.outputPath);
  }
  
  return options.outputPath;
}

// Re-export for backward compatibility
export { serializeResult } from './serializer';
