import { z } from 'zod';
import { JSONAgent } from './json_agent';
import { BaseAgent } from './base_agent';
import { LLMModelConfig } from '@main/db/entities/LLMModel.js';

/**
 * Schema for title, description, and tag suggestions generation
 */
export const TitleGenerationSchema = z.object({
  title: z.string().min(1).max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less'),
  suggestedTags: z.array(z.string().min(1).max(30, 'Tag must be 30 characters or less')).max(5, 'Maximum 5 tags suggested'),
});

export type TitleGenerationResult = z.infer<typeof TitleGenerationSchema>;

/**
 * TitleAgent - Generates meaningful titles, descriptions, and suggests tags for chats
 *
 * This agent analyzes conversation content and generates:
 * - A concise, descriptive title (max 100 chars)
 * - A brief description/summary (max 500 chars)
 * - Up to 5 suggested tags based on the conversation content
 */
export class TitleAgent extends BaseAgent {
  private modelConfig: LLMModelConfig;

  constructor(modelConfig: LLMModelConfig) {
    super();
    this.modelConfig = modelConfig;
  }

  protected getServiceName(): string {
    return 'TitleAgent';
  }

  /**
   * Generate title, description, and tags from conversation content
   *
   * @param conversationContent - The conversation text to analyze
   * @returns Promise that resolves to generated title data
   */
  async generateTitle(conversationContent: string): Promise<TitleGenerationResult> {
    this.log('Starting title generation');

    const prompt = this.renderTemplate('titleGeneration', {
      conversationContent
    });
    this.log('Built prompt for title generation using Handlebars template');

    const jsonAgent = new JSONAgent(this.modelConfig);
    this.log('Creating JSON agent with model:', this.modelConfig.modelIdentifier);

    // Generate title and description
    const result = await jsonAgent.generate(prompt, TitleGenerationSchema);
    this.log('LLM response received:', result);

    this.log(`✓ Successfully generated title: "${result.title}"`);
    return result;
  }
}
