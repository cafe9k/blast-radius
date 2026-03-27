import fs from 'fs-extra';
import path from 'path';
import type { BlastRadiusConfig } from '../types/config';

const DEFAULT_CONFIG: BlastRadiusConfig = {
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
    apiKey: '',
    baseUrl: null,
    enableCache: true,
  },
  output: {
    format: ['html'],
    openBrowser: true,
  },
};

export async function loadConfig(
  projectPath: string,
  configPath?: string
): Promise<BlastRadiusConfig> {
  const configFilePath = configPath
    ? path.resolve(configPath)
    : path.join(projectPath, 'blast-radius.config.json');
  
  let config = { ...DEFAULT_CONFIG };
  
  // Load file config
  if (await fs.pathExists(configFilePath)) {
    const fileConfig = await fs.readJSON(configFilePath);
    config = deepMerge(config, fileConfig);
  }
  
  // Override with environment variables
  config = applyEnvVariables(config);
  
  return config;
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}

function applyEnvVariables(config: BlastRadiusConfig): BlastRadiusConfig {
  const envMappings = {
    'BLAST_RADIUS_LLM_PROVIDER': (value: string) => { config.llm.provider = value as any; },
    'BLAST_RADIUS_LLM_API_KEY': (value: string) => { config.llm.apiKey = value; },
    'BLAST_RADIUS_LLM_MODEL': (value: string) => { config.llm.model = value; },
    'BLAST_RADIUS_LLM_BASE_URL': (value: string) => { config.llm.baseUrl = value; },
    'BLAST_RADIUS_CACHE_DIR': (value: string) => { config.analysis.cacheDir = value; },
  };
  
  for (const [envKey, setter] of Object.entries(envMappings)) {
    const value = process.env[envKey];
    if (value) {
      setter(value);
    }
  }
  
  // Resolve environment variables in config values
  if (config.llm.apiKey.includes('${')) {
    const match = config.llm.apiKey.match(/\$\{(.+)\}/);
    if (match) {
      config.llm.apiKey = process.env[match[1]] || '';
    }
  }
  
  return config;
}
