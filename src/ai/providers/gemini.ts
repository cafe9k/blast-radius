import { BaseLLMProvider } from './base';
import type { LLMProviderConfig, LLMRequest, LLMResponse } from '../../types/llm';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends BaseLLMProvider {
  validateConfig(): boolean {
    return Boolean(this.config.apiKey);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new Error('Gemini API key is required');
    }

    const model = request.model || this.config.model || 'gemini-pro';
    const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';

    const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert software architect analyzing React component dependencies.\n\n${request.prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json() as GeminiResponse;

    return {
      content: data.candidates[0].content.parts[0].text,
      model,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      } : undefined,
    };
  }
}
