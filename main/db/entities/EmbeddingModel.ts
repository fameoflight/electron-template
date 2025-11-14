/**
 * EmbeddingModel - Custom entity extension
 *
 * This file extends the generated EmbeddingModelBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/EmbeddingModel.json
 */
import { Entity, Index, BeforeInsert } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { EmbeddingModelBase } from './__generated__/EmbeddingModelBase.js';
import { ConnectionKind } from '@main/db/entities/__generated__/ConnectionBase.js';


export type EmbeddingModelConfig = {
  modelIdentifier: string;
  baseUrl: string;
  apiKey: string;
  kind: ConnectionKind;
  customHeaders?: Record<string, string>;
  dimension: number;
  contextLength: number;
  maxBatchSize: number;
}

@Index("IDX_embeddingmodel_userId", ['userId'])
@Index("IDX_embeddingmodel_connectionId", ['connectionId'])
@ObjectType({ description: 'Embedding model entity' })
@Entity('embedding_models')
export class EmbeddingModel extends EmbeddingModelBase {
  // Add custom methods and computed fields here

  // Example: Computed field
  // @Field(() => String, { description: 'Display name' })
  // get displayName(): string {
  //   return `${this.name} (${this.id})`;
  // }

  // Example: Lifecycle hook
  // @BeforeInsert()
  // doSomethingBeforeInsert() {
  //   // Custom logic
  // }

  getModelConfig(): EmbeddingModelConfig {
    return {
      modelIdentifier: this.modelIdentifier,
      baseUrl: this.connection.baseUrl,
      apiKey: this.connection.apiKey,
      kind: this.connection.kind,
      customHeaders: this.connection.customHeaders || {},
      dimension: this.dimension,
      contextLength: this.contextLength,
      maxBatchSize: this.maxBatchSize ?? 16,
    };
  }
}
