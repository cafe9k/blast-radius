export interface ScanConfig {
  include: string[];
  exclude: string[];
}

export interface AnalysisConfig {
  depth: 'quick' | 'full';
  enableCache: boolean;
  cacheDir: string;
}

export interface LLMConfig {
  provider: 'openai' | 'claude' | 'deepseek' | 'gemini' | 'ollama';
  model: string;
  apiKey: string;
  baseUrl?: string | null;
  enableCache: boolean;
}

export interface OutputConfig {
  format: ('html' | 'json')[];
  openBrowser: boolean;
}

export interface BlastRadiusConfig {
  scan: ScanConfig;
  analysis: AnalysisConfig;
  llm: LLMConfig;
  output: OutputConfig;
}
