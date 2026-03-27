export type LLMProvider = 'openai' | 'claude' | 'deepseek' | 'gemini' | 'ollama';

export interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}
