/**
 * LLMModel - Custom entity extension
 *
 * This file extends the generated LLMModelBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/LLMModel.json
 */
import { Entity, Index, BeforeInsert } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { LLMModelBase } from './__generated__/LLMModelBase.js';
import { ConnectionKind } from '@main/db/entities/__generated__/ConnectionBase.js';

export type LLMModelConfig = {
  modelIdentifier: string;
  baseUrl: string;
  apiKey: string;
  kind: ConnectionKind;
  customHeaders?: Record<string, string>;
  temperature: number;
  contextLength: number;
}

function scaleTemperatureForProvider(temperature: number, providerKind: ConnectionKind): number {
  if (providerKind === ConnectionKind.ANTHROPIC) {
    // Scale 0-2 range to 0-1 for Anthropic
    return Math.min(temperature / 2, 1);
  }
  // For other providers, use temperature as-is (0-2 range)
  return temperature;
}

@Index("IDX_llmmodel_connectionId", ['connectionId'])
@ObjectType({ description: 'LLM Model entity' })
@Entity('llm_models')
export class LLMModel extends LLMModelBase {

  getModelConfig(): LLMModelConfig {
    return {
      modelIdentifier: this.modelIdentifier,
      baseUrl: this.connection.baseUrl,
      apiKey: this.connection.apiKey,
      kind: this.connection.kind,
      customHeaders: this.connection.customHeaders || {},
      temperature: scaleTemperatureForProvider(this.temperature, this.connection.kind),
      contextLength: this.contextLength,
    };
  }

}
