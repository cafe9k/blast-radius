import { BaseLLMProvider } from './base';
import type { LLMProviderConfig, LLMRequest, LLMResponse } from '../../types/llm';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekProvider extends BaseLLMProvider {
  validateConfig(): boolean {
    return Boolean(this.config.apiKey);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new Error('DeepSeek API key is required');
    }

    const baseUrl = this.config.baseUrl || 'https://api.deepseek.com/v1';
    const model = request.model || this.config.model || 'deepseek-chat';

    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are an expert software architect analyzing React component dependencies.',
      },
      {
        role: 'user',
        content: request.prompt,
      },
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json() as DeepSeekResponse;

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }
}
