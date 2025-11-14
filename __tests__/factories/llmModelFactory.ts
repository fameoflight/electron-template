/**
 * LLM Model Factory
 * Factory functions for creating LLM model test data
 */

import { LLMModel } from '@main/db/entities/LLMModel.js';
import { LLMModelCapability } from '@db/entities/__generated__/LLMModelBase';

export interface CreateLLMModelOptions {
  connectionId?: string;
  name?: string;
  modelIdentifier?: string;
  temperature?: number;
  contextLength?: number;
  capabilities?: LLMModelCapability[];
  userId?: string;
}

export async function createLLMModel(
  dataSource: any,
  options: CreateLLMModelOptions = {}
) {
  const llmModelRepository = dataSource.getRepository(LLMModel);

  const defaultOptions = {
    name: 'Test LLM Model',
    modelIdentifier: 'gpt-3.5-turbo',
    temperature: 0.7,
    contextLength: 4096,
    capabilities: [LLMModelCapability.TEXT],
    userId: options.userId || 'test-user-id',
    ...options
  };

  const llmModel = await llmModelRepository.save(defaultOptions);
  return llmModel;
}

export async function createLLMModels(
  dataSource: any,
  count: number,
  options: CreateLLMModelOptions = {}
) {
  const models = [];
  for (let i = 0; i < count; i++) {
    const model = await createLLMModel(dataSource, {
      ...options,
      name: options.name ? `${options.name} ${i + 1}` : `Test Model ${i + 1}`,
      modelIdentifier: options.modelIdentifier || `model-${i + 1}`
    });
    models.push(model);
  }
  return models;
}