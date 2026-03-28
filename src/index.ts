#!/usr/bin/env node
import { program } from 'commander';
import { analyzeCommand } from './cli/commands/analyze';
import { configCommand } from './cli/commands/config';
import chalk from 'chalk';

const VERSION = '1.0.0';

program
  .name('blast-radius')
  .description('Analyze component dependency relationships and blast radius in React projects')
  .version(VERSION);

program
  .command('analyze [path]')
  .description('Analyze a React project and generate dependency report')
  .option('-o, --output <format>', 'Output format (html, json)', 'html')
  .option('--no-cache', 'Disable cache for analysis')
  .option('--no-llm', 'Disable LLM analysis')
  .option('-d, --depth <level>', 'Analysis depth (quick, full)', 'full')
  .option('-c, --config <file>', 'Path to config file')
  .option('--open', 'Open report in browser after generation', true)
  .action(analyzeCommand);

program
  .command('config')
  .description('Manage blast-radius configuration')
  .option('--init', 'Initialize configuration file')
  .option('--show', 'Show current configuration')
  .option('--set <key=value>', 'Set a configuration value')
  .action(configCommand);

program
  .command('clear-cache')
  .description('Clear analysis cache')
  .action(async () => {
    const { clearCache } = await import('./utils/cache.js');
    await clearCache();
    console.log(chalk.green('✓ Cache cleared successfully'));
  });

program.parse();
