import { BaseLLMProvider } from './base';
import type { LLMProviderConfig, LLMRequest, LLMResponse } from '../../types/llm';

interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeProvider extends BaseLLMProvider {
  validateConfig(): boolean {
    return Boolean(this.config.apiKey);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new Error('Claude API key is required');
    }

    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    const model = request.model || this.config.model || 'claude-3-opus-20240229';

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
        system: 'You are an expert software architect analyzing React component dependencies.',
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json() as ClaudeResponse;

    return {
      content: data.content[0].text,
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    };
  }
}
