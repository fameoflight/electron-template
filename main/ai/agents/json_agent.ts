import { LLMModelConfig } from '@main/db/entities/LLMModel';
import { generateStructured } from './utils';
import { z } from 'zod';

/**
 * JSONAgent - A generic agent for generating structured JSON responses from LLMs
 *
 * This agent takes a prompt and a Zod schema, and returns validated JSON data
 * that conforms to the schema. It handles retries and validation automatically.
 */
export class JSONAgent {
  private modelConfig: LLMModelConfig;

  constructor(modelConfig: LLMModelConfig) {
    this.modelConfig = modelConfig;
  }

  /**
   * Generate structured JSON data from the LLM
   *
   * @param prompt - The instruction prompt for the LLM
   * @param schema - Zod schema for validation and type inference
   * @param maxRetries - Maximum number of retries on validation failure (default: 2)
   * @returns Validated and typed data conforming to the schema
   */
  async generate<T extends z.ZodTypeAny>(
    prompt: string,
    schema: T,
    maxRetries: number = 2
  ): Promise<z.infer<T>> {
    console.log('[JSONAgent] Starting JSON generation');
    console.log('[JSONAgent] Model:', this.modelConfig.modelIdentifier);
    console.log('[JSONAgent] Max retries:', maxRetries);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      console.log(`[JSONAgent] Attempt ${attempt + 1} of ${maxRetries + 1}`);

      try {
        console.log('[JSONAgent] Calling LLM with generateStructured...');

        const object = await generateStructured(
          this.modelConfig,
          prompt,
          schema,
          {
            temperature: 0.3, // Lower temperature for more consistent JSON
            maxOutputTokens: 500, // Reasonable limit for metadata generation
          }
        );

        console.log('[JSONAgent] ✓ Object generated and validated successfully');
        return object as z.infer<T>;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[JSONAgent] ✗ Attempt ${attempt + 1} failed:`, lastError.message);

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Otherwise, wait a bit before retrying
        const waitTime = 1000 * (attempt + 1);
        console.log(`[JSONAgent] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    console.error('[JSONAgent] ✗ All attempts exhausted');
    throw new Error(`Failed to generate valid JSON after ${maxRetries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Generate structured JSON data with streaming support (for future use)
   * Currently not implemented, but placeholder for potential streaming JSON parsing
   */
  async generateStream<T extends z.ZodTypeAny>(
    prompt: string,
    schema: T,
    onChunk?: (partial: string) => void
  ): Promise<z.infer<T>> {
    // TODO: Implement streaming JSON generation when needed
    // For now, fallback to non-streaming
    return this.generate(prompt, schema);
  }
}
