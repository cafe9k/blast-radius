import type { LLMProviderConfig, LLMRequest, LLMResponse } from '../../types/llm';

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract generate(request: LLMRequest): Promise<LLMResponse>;
  abstract validateConfig(): boolean;

  protected getDefaultModel(): string {
    return 'gpt-4';
  }

  protected handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}
