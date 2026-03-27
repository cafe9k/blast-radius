import type Graph from 'graphology';
import type { ComponentNode } from '../types/component.js';
import type { BlastRadiusMetrics, AIInsights } from '../types/graph.js';
import type { LLMConfig } from '../types/config.js';
import { BaseLLMProvider } from './providers/base.js';
import { OpenAIProvider } from './providers/openai.js';
import { ClaudeProvider } from './providers/claude.js';
import { DeepSeekProvider } from './providers/deepseek.js';
import { GeminiProvider } from './providers/gemini.js';
import { OllamaProvider } from './providers/ollama.js';
import { generateAnalysisPrompt, parseAnalysisResponse } from './prompts.js';
import { getCachedResult, setCachedResult } from '../utils/cache.js';
import crypto from 'crypto';

export async function analyzeWithLLM(
  graph: Graph,
  components: ComponentNode[],
  metrics: Map<string, BlastRadiusMetrics>,
  config: LLMConfig
): Promise<AIInsights> {
  if (!config.apiKey && config.provider !== 'ollama') {
    throw new Error(`API key is required for ${config.provider}`);
  }
  
  // Generate cache key
  const cacheKey = generateCacheKey(graph, config);
  
  // Check cache
  if (config.enableCache) {
    const cached = await getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Create provider
  const provider = createProvider(config);
  
  // Generate prompt
  const prompt = generateAnalysisPrompt(graph, components, metrics);
  
  // Call LLM
  const response = await provider.generate({
    prompt,
    temperature: 0.7,
    maxTokens: 2000,
  });
  
  // Parse response
  const { summary, risks, suggestions } = parseAnalysisResponse(response.content);
  
  const insights: AIInsights = {
    summary,
    risks,
    suggestions,
    analyzedAt: new Date().toISOString(),
  };
  
  // Cache result
  if (config.enableCache) {
    await setCachedResult(cacheKey, insights);
  }
  
  return insights;
}

function createProvider(config: LLMConfig): BaseLLMProvider {
  const providers = {
    openai: OpenAIProvider,
    claude: ClaudeProvider,
    deepseek: DeepSeekProvider,
    gemini: GeminiProvider,
    ollama: OllamaProvider,
  };
  
  const ProviderClass = providers[config.provider];
  if (!ProviderClass) {
    throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
  
  return new ProviderClass({
    provider: config.provider,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
  });
}

function generateCacheKey(graph: Graph, config: LLMConfig): string {
  const graphHash = crypto
    .createHash('md5')
    .update(JSON.stringify({
      nodes: graph.order,
      edges: graph.size,
    }))
    .digest('hex');
  
  return `llm-${config.provider}-${config.model}-${graphHash}`;
}
