import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase.js';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createAnthropic } from '@ai-sdk/anthropic';

type OpenAICompatibleProvider = ReturnType<typeof createOpenAICompatible>;
type AnthropicProvider = ReturnType<typeof createAnthropic>;
export type AIProvider = OpenAICompatibleProvider | AnthropicProvider;

export type EmbeddingModelType = ReturnType<ReturnType<typeof createOpenAICompatible>['textEmbeddingModel']>;

// Provider caches for reusing connections
const providerCache = new Map<string, AIProvider>();



export function getOrCreateProviderMinimal(
  baseURL: string,
  apiKey: string,
  kind: ConnectionKind,
  headers?: Record<string, string>
): AIProvider {
  const key = `${kind}:${baseURL}:${apiKey}`;

  if (!providerCache.has(key)) {
    let provider: AIProvider | undefined;

    // Create provider based on kind
    if (kind === ConnectionKind.ANTHROPIC) {
      // Always add browser access header for Anthropic
      // This header is required for browser-based access and ignored in Node.js
      provider = createAnthropic({
        apiKey,
        baseURL,
        headers: {
          'anthropic-dangerous-direct-browser-access': 'true',
          ...headers
        }
      });
    } else if (kind === ConnectionKind.OPENAI) {
      provider = createOpenAICompatible({
        name: 'custom-provider',
        apiKey,
        baseURL,
        headers
      });
    } else {
      throw new Error(`Unsupported provider kind: ${kind}`);
    }
    providerCache.set(key, provider);
  }

  return providerCache.get(key)!;
}