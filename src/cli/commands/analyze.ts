import chalk from 'chalk';
import ora from 'ora';
import type { Command } from 'commander';
import { scanFiles } from '@/analyzer/scanner';
import { parseReactComponents } from '@/analyzer/parser/react';
import { buildDependencyGraph } from '@/analyzer/graph-builder';
import { calculateBlastRadius } from '@/metrics/blast-radius';
import { generateReport } from '@/output/report-generator';
import { loadConfig } from '@/utils/config-loader';
import { initCache, getCacheStats } from '@/utils/cache';
import open from 'open';
import path from 'path';
import fs from 'fs-extra';

interface AnalyzeOptions {
  output: string;
  cache: boolean;
  llm: boolean;
  depth: string;
  config?: string;
  open: boolean;
}

export async function analyzeCommand(
  projectPath: string = process.cwd(),
  options: AnalyzeOptions,
  command: Command
) {
  const absolutePath = path.resolve(projectPath);
  
  console.log(chalk.bold.cyan('\n🔥 Blast Radius Analyzer\n'));
  console.log(chalk.gray('Analyzing project at:'), chalk.white(absolutePath));
  
  try {
    // Load configuration
    const spinner = ora('Loading configuration...').start();
    const config = await loadConfig(absolutePath, options.config);
    spinner.succeed('Configuration loaded');
    
    // Initialize cache
    if (config.analysis.enableCache && options.cache) {
      await initCache(absolutePath, config.analysis.cacheDir);
      const cacheStats = await getCacheStats();
      console.log(chalk.gray('Cache:'), chalk.white(`${cacheStats.cachedFiles} cached files`));
    }
    
    // Scan files
    const scanSpinner = ora('Scanning project files...').start();
    const files = await scanFiles(absolutePath, config.scan);
    scanSpinner.succeed(`Found ${chalk.cyan(files.length)} component files`);
    
    if (files.length === 0) {
      console.log(chalk.yellow('\n⚠ No component files found. Check your scan configuration.'));
      return;
    }
    
    // Parse components
    const parseSpinner = ora('Parsing components...').start();
    const components = await parseReactComponents(files, absolutePath);
    parseSpinner.succeed(`Parsed ${chalk.cyan(components.length)} components`);
    
    // Build dependency graph
    const graphSpinner = ora('Building dependency graph...').start();
    const graph = await buildDependencyGraph(components, absolutePath);
    graphSpinner.succeed(`Built graph with ${chalk.cyan(graph.size)} nodes`);
    
    // Calculate blast radius
    const metricsSpinner = ora('Calculating blast radius metrics...').start();
    const metrics = await calculateBlastRadius(graph, components);
    metricsSpinner.succeed('Metrics calculated');
    
    // LLM analysis (optional)
    let aiInsights = null;
    if (options.llm && config.llm.apiKey) {
      const llmSpinner = ora('Analyzing with LLM...').start();
      try {
        const { analyzeWithLLM } = await import('../ai/client');
        aiInsights = await analyzeWithLLM(graph, components, metrics, config.llm);
        llmSpinner.succeed('LLM analysis completed');
      } catch (error) {
        llmSpinner.warn('LLM analysis failed (continuing without AI insights)');
        console.log(chalk.gray('  Error:', error instanceof Error ? error.message : 'Unknown error'));
      }
    }
    
    // Generate report
    const reportSpinner = ora('Generating report...').start();
    const outputPath = await generateReport(
      {
        project: {
          name: path.basename(absolutePath),
          path: absolutePath,
          componentCount: components.length,
          analyzedAt: new Date().toISOString(),
        },
        components,
        metrics,
        aiInsights,
      },
      {
        format: options.output.split(',') as ('html' | 'json')[],
        outputPath: path.join(absolutePath, 'blast-radius-report.html'),
      }
    );
    reportSpinner.succeed('Report generated');
    
    console.log(chalk.green('\n✓ Analysis complete!\n'));
    console.log(chalk.gray('Report saved to:'), chalk.white(outputPath));
    
    // Open in browser
    if (options.open && options.output.includes('html')) {
      await open(outputPath);
    }
    
  } catch (error) {
    console.error(chalk.red('\n✗ Analysis failed\n'));
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
