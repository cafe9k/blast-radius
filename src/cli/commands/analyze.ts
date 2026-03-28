import chalk from 'chalk';
import ora from 'ora';
import type { Command } from 'commander';
import { scanFiles } from '@/analyzer/scanner';
import { parseReactComponents } from '@/analyzer/parser/react';
import { buildDependencyGraph } from '@/analyzer/graph-builder';
import { calculateBlastRadius } from '@/metrics/blast-radius';
import { generateReport } from '@/output/report-generator';
import { loadConfig } from '@/utils/config-loader';
import {
  initGraphCache,
  closeGraphCache,
  computeCacheDiff,
  getCachedComponents,
  updateCache,
  removeCachedFiles,
  getGraphCacheStats,
} from '@/utils/graph-cache';
import open from 'open';
import path from 'path';
import fs from 'fs-extra';
import http from 'http';
import { fileURLToPath } from 'url';
import type { ScannedFile } from '@/analyzer/scanner';
import type { ComponentNode } from '@/types/component';

interface AnalyzeOptions {
  output: string;
  cache: boolean;
  llm: boolean;
  depth: string;
  config?: string;
  open: boolean;
  serve: boolean;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function startServer(reportPath: string, projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const reportDir = path.dirname(reportPath);
    
    const server = http.createServer((req, res) => {
      let filePath: string;
      
      // Parse URL to remove query string
      const urlPath = req.url?.split('?')[0] || '/';
      
      if (urlPath === '/' || urlPath === '/blast-radius-report.html') {
        filePath = reportPath;
      } else if (urlPath.startsWith('/assets/')) {
        // Assets are in the same directory as the report
        filePath = path.join(reportDir, urlPath);
      } else {
        filePath = path.join(projectPath, urlPath);
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      fs.readFile(filePath)
        .then(data => {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        })
        .catch(() => {
          res.writeHead(404);
          res.end('Not Found');
        });
    });
    
    const port = 60125; // Use fixed port for consistency
    server.listen(port, () => {
      const url = `http://localhost:${port}/blast-radius-report.html`;
      console.log(chalk.cyan(`\n🌐 Server running at ${url}\n`));
      open(url).catch(err => {
        console.log(chalk.yellow(`Could not open browser: ${err.message}`));
        console.log(chalk.gray(`Open manually: ${url}`));
      });
    });
    
    server.on('error', (err) => {
      if ((err as any).code === 'EADDRINUSE') {
        console.log(chalk.yellow(`Port ${port} in use, trying next...`));
        server.listen(0);
      } else {
        reject(err);
      }
    });
  });
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
    
    // Initialize graph cache
    let useCache = config.analysis.enableCache && options.cache;
    if (useCache) {
      try {
        initGraphCache(absolutePath, config.analysis.cacheDir);
        const cacheStats = getGraphCacheStats();
        console.log(chalk.gray('Cache:'), chalk.white(`${cacheStats.cachedFiles} cached files`));
      } catch (error) {
        console.log(chalk.yellow('Cache initialization failed, continuing without cache'));
        useCache = false;
      }
    }
    
    // Scan files
    const scanSpinner = ora('Scanning project files...').start();
    const files = await scanFiles(absolutePath, config.scan);
    scanSpinner.succeed(`Found ${chalk.cyan(files.length)} component files`);
    
    if (files.length === 0) {
      console.log(chalk.yellow('\n⚠ No component files found. Check your scan configuration.'));
      closeGraphCache();
      return;
    }
    
    // Compute cache diff for incremental analysis
    let components: ComponentNode[] = [];
    let filesToParse: ScannedFile[] = files;
    
    if (useCache) {
      const filePaths = files.map(f => f.path);
      const diff = computeCacheDiff(filePaths, absolutePath);
      
      if (diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0) {
        console.log(chalk.gray('  Cache diff:'),
          chalk.green(`+${diff.added.length}`),
          chalk.yellow(`~${diff.modified.length}`),
          chalk.red(`-${diff.deleted.length}`),
          chalk.dim(`=${diff.unchanged.length}`));
      }
      
      // Get cached components for unchanged files
      const cachedComponents = getCachedComponents(diff.unchanged);
      
      // Only parse new and modified files
      const changedPaths = new Set([...diff.added, ...diff.modified]);
      filesToParse = files.filter(f => changedPaths.has(f.path));
      
      if (filesToParse.length < files.length) {
        console.log(chalk.gray(`  Incremental: parsing ${filesToParse.length}/${files.length} files`));
      }
      
      // Parse only changed files
      const parseSpinner = ora('Parsing components...').start();
      const parsedComponents = filesToParse.length > 0
        ? await parseReactComponents(filesToParse, absolutePath)
        : [];
      parseSpinner.succeed(`Parsed ${chalk.cyan(parsedComponents.length)} new/modified components`);
      
      // Combine with cached components
      components = [...cachedComponents, ...parsedComponents];
      
      // Update cache
      const cacheUpdates = parsedComponents.map(c => ({ path: c.path, component: c }));
      if (cacheUpdates.length > 0) {
        updateCache(cacheUpdates, absolutePath);
      }
      
      // Remove deleted files from cache
      if (diff.deleted.length > 0) {
        removeCachedFiles(diff.deleted);
      }
    } else {
      // Full parse without cache
      const parseSpinner = ora('Parsing components...').start();
      components = await parseReactComponents(files, absolutePath);
      parseSpinner.succeed(`Parsed ${chalk.cyan(components.length)} components`);
    }
    
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
    
    // Close cache
    closeGraphCache();
    
    // Serve or open in browser
    if (options.serve && options.output.includes('html')) {
      await startServer(outputPath, absolutePath);
      // Keep process alive
      process.stdin.resume();
    } else if (options.open && options.output.includes('html')) {
      await open(outputPath);
    }
    
  } catch (error) {
    closeGraphCache();
    console.error(chalk.red('\n✗ Analysis failed\n'));
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
