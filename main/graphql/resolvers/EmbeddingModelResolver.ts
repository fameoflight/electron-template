/**
 * EmbeddingModelResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from EmbeddingModelResolverBase):
 * - Queries: embeddingModel(id), embeddingModels(args), embeddingModelsArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput()(from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { EmbeddingModelResolverBase } from './__generated__/EmbeddingModelResolverBase.js';
import { EmbeddingModel } from '@db/entities/EmbeddingModel.js';
import { Connection } from '@db/entities/Connection.js';
import type { GraphQLContext } from '@shared/types';
import { verifyEmbeddingModel } from '@main/ai/verifier.js';

@Resolver(() => EmbeddingModel)
export class EmbeddingModelResolver extends EmbeddingModelResolverBase {
  protected async validateInput<T>(input: T): Promise<T> {
    // First run base validation
    const validatedInput = await super.validateInput(input);

    // Extract connectionId and modelIdentifier from the input
    const inputObj = validatedInput as any;
    if (!inputObj.connectionId || !inputObj.modelIdentifier) {
      return validatedInput; // Skip verification if required fields are missing
    }

    try {
      // Fetch the connection to get API details
      const connection = await this.getRawRepository(Connection).findOne({
        where: { id: inputObj.connectionId }
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Verify the embedding model with the connection details
      const verificationResult = await verifyEmbeddingModel(
        connection.baseUrl,
        connection.apiKey,
        connection.kind,
        inputObj.modelIdentifier,
        connection.customHeaders || undefined
      );

      if (!verificationResult.success) {
        throw new Error(`Failed to verify embedding model "${inputObj.modelIdentifier}" with connection "${connection.name}"`);
      }

      // Override the input dimension with the actual embedding dimension
      if (verificationResult.dimension) {
        inputObj.dimension = verificationResult.dimension;
      }

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Model validation failed: ${error.message}`);
      }
      throw new Error('Model validation failed: Unknown error');
    }

    return validatedInput;
  }
}
