import { generateText, embed } from 'ai';
import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase.js';

import { getOrCreateProviderMinimal } from './providerFactory';

/**
 * Verify an LLM model by generating a small text completion
 * @param baseURL The base URL of the provider API
 * @param apiKey The API key for authentication
 * @param kind The provider kind (OPENAI or ANTHROPIC)
 * @param modelName The model name to test
 * @param temperature Optional temperature setting for generation
 * @param customHeaders Optional custom headers to include
 * @returns Promise<boolean> True if the model works, false otherwise
 */
export async function verifyLLMModel(
  baseURL: string,
  apiKey: string,
  kind: ConnectionKind,
  modelName: string,
  temperature?: number,
  customHeaders?: Record<string, string>
): Promise<boolean> {
  try {
    const provider = getOrCreateProviderMinimal(baseURL, apiKey, kind, customHeaders);
    const model = provider(modelName);

    await generateText({
      model,
      prompt: 'Respond with just the word "OK" to verify the connection.',
      maxTokens: 10,
      temperature: temperature ?? 0.7,
    } as any);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verify an embedding model by generating a small embedding
 * Note: Only OpenAI-compatible models are supported for embeddings
 * @param baseURL The base URL of the provider API
 * @param apiKey The API key for authentication
 * @param kind The provider kind (must be OPENAI)
 * @param modelName The model name to test
 * @param customHeaders Optional custom headers to include
 * @returns Promise<{success: boolean, dimension?: number}> Success status and embedding dimension if successful
 */
export async function verifyEmbeddingModel(
  baseURL: string,
  apiKey: string,
  kind: ConnectionKind,
  modelName: string,
  customHeaders?: Record<string, string>
): Promise<{ success: boolean, dimension?: number }> {
  try {
    // Only OpenAI-compatible models support embeddings
    if (kind !== ConnectionKind.OPENAI) {
      throw new Error('Embeddings are only supported for OpenAI-compatible providers');
    }

    const provider = getOrCreateProviderMinimal(baseURL, apiKey, kind, customHeaders);
    const model = provider.textEmbeddingModel(modelName);

    const { embedding } = await embed({
      model,
      value: 'test embedding verification',
    });

    // Verify we got a valid embedding (should be an array of numbers)
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Invalid embedding response received');
    }

    return { success: true, dimension: embedding.length };
  } catch (error) {
    return { success: false };
  }
}