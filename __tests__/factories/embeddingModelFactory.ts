/**
 * Embedding Model Factory
 * Factory functions for creating embedding model test data
 */

import { EmbeddingModel } from '@main/db/entities/EmbeddingModel.js';
import { DataSource } from 'typeorm';

export interface CreateEmbeddingModelOptions {
  connectionId?: string;
  name?: string;
  modelIdentifier?: string;
  dimension?: number;
  contextLength?: number;
  baseUrl?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  userId?: string;
}

export async function createEmbeddingModel(
  dataSource: DataSource,
  options: CreateEmbeddingModelOptions = {}
) {
  const embeddingModelRepository = dataSource.getRepository(EmbeddingModel);

  const defaultOptions = {
    name: 'Test Embedding Model',
    modelIdentifier: 'text-embedding-nomic-embed-text-v1.5',
    dimension: 768,
    contextLength: 2048,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'test-api-key',
    customHeaders: {},
    maxBatchSize: 16,
    userId: options.userId || 'test-user-id',
    ...options
  };

  const embeddingModel = await embeddingModelRepository.save(defaultOptions);
  return embeddingModel;
}

export async function createEmbeddingModels(
  dataSource: any,
  count: number,
  options: CreateEmbeddingModelOptions = {}
) {
  const models = [];
  for (let i = 0; i < count; i++) {
    const model = await createEmbeddingModel(dataSource, {
      ...options,
      name: options.name ? `${options.name} ${i + 1}` : `Test Embedding Model ${i + 1}`,
      modelIdentifier: options.modelIdentifier || `text-embedding-model-${i + 1}`
    });
    models.push(model);
  }
  return models;
}