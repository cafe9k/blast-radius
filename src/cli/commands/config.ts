import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import type { Command } from 'commander';

interface ConfigOptions {
  init?: boolean;
  show?: boolean;
  set?: string;
}

export async function configCommand(options: ConfigOptions, command: Command) {
  const configPath = path.join(process.cwd(), 'blast-radius.config.json');
  
  if (options.init) {
    // Create default config file
    const defaultConfig = {
      scan: {
        include: ['src/**/*.{ts,tsx,jsx}'],
        exclude: [
          'node_modules/**',
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          '**/__tests__/**',
          '**/*.d.ts',
          '**/dist/**',
          '**/build/**',
        ],
      },
      analysis: {
        depth: 'full',
        enableCache: true,
        cacheDir: '.blast-radius/cache',
      },
      llm: {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: '${OPENAI_API_KEY}',
        baseUrl: null,
        enableCache: true,
      },
      output: {
        format: ['html', 'json'],
        openBrowser: true,
      },
    };
    
    await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
    console.log(chalk.green('✓ Configuration file created:'), chalk.white(configPath));
    return;
  }
  
  if (options.show) {
    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.yellow('⚠ No configuration file found'));
      console.log(chalk.gray('Run'), chalk.cyan('blast-radius config --init'), chalk.gray('to create one'));
      return;
    }
    
    const config = await fs.readJSON(configPath);
    console.log(chalk.bold('\n📋 Current Configuration:\n'));
    console.log(JSON.stringify(config, null, 2));
    return;
  }
  
  if (options.set) {
    const [key, value] = options.set.split('=');
    if (!key || value === undefined) {
      console.log(chalk.red('✗ Invalid format. Use: --set key=value'));
      return;
    }
    
    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.yellow('⚠ No configuration file found. Creating one...'));
      await fs.writeJSON(configPath, {}, { spaces: 2 });
    }
    
    const config = await fs.readJSON(configPath);
    const keys = key.split('.');
    let current: any = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    await fs.writeJSON(configPath, config, { spaces: 2 });
    console.log(chalk.green('✓ Configuration updated'));
    return;
  }
  
  // Default: show help
  console.log(chalk.bold('\nConfiguration Commands:\n'));
  console.log(chalk.cyan('  --init') + chalk.gray('        Create default configuration file'));
  console.log(chalk.cyan('  --show') + chalk.gray('        Show current configuration'));
  console.log(chalk.cyan('  --set key=value') + chalk.gray(' Set a configuration value\n'));
}
