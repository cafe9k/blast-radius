import fs from 'fs-extra';
import type { AnalysisResult } from '../types';
import { serializeResult } from './serializer';

/**
 * Generate JSON report file
 */
export async function generateJSONReport(
  result: AnalysisResult,
  outputPath: string
): Promise<string> {
  await fs.writeJSON(outputPath, serializeResult(result), { spaces: 2 });
  console.log(`  JSON report: ${outputPath}`);
  return outputPath;
}
