import { getOrCreateProviderMinimal } from "../providerFactory";
import { LLMModelConfig } from "@main/db/entities/LLMModel";
import { generateText } from "ai";
import z from "zod";

/**
 * Generate structured object using AI SDK
 * Falls back to JSON parsing if structured output is not supported
 */
export async function generateStructured<T>(
  modelConfig: LLMModelConfig,
  prompt: string,
  schema: z.ZodTypeAny,
  options: {
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
): Promise<T> {
  const provider = getOrCreateProviderMinimal(modelConfig.baseUrl, modelConfig.apiKey, modelConfig.kind, modelConfig.customHeaders);

  const model = provider(modelConfig.modelIdentifier);

  // Fallback: Use regular text generation and parse JSON manually
  // This works with local models that don't support structured output
  const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. Do not include any explanation or markdown formatting. Just the raw JSON object.`;

  const { text } = await generateText({
    model: model,
    prompt: jsonPrompt,
    temperature: options.temperature ?? modelConfig.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens ?? 500
  });

  // Extract JSON from response (handles cases where model adds markdown formatting)
  let jsonText = text.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n/, '').replace(/\n```\s*$/, '');
  }

  // Parse and validate with Zod
  try {
    const parsed = JSON.parse(jsonText);
    const validated = schema.parse(parsed);
    return validated as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}\nResponse: ${jsonText}`);
  }
}