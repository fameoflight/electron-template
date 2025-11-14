/**
 * LLMModelResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from LLMModelResolverBase):
 * - Queries: lLMModel(id), lLMModels(args), lLMModelsArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput()(from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Arg, Ctx, Mutation, Resolver } from 'type-graphql';
import { LLMModelResolverBase } from './__generated__/LLMModelResolverBase.js';
import { LLMModel } from '@db/entities/LLMModel.js';
import { Connection } from '@db/entities/Connection.js';
import { verifyLLMModel } from '@main/ai/verifier.js';
import type { GraphQLContext } from '@shared/types';

@Resolver(() => LLMModel)
export class LLMModelResolver extends LLMModelResolverBase {

  @Mutation(() => LLMModel, { description: 'Set an LLM model as the default' })
  async setDefaultLLMModel(@Arg('id', () => String) id: string, @Ctx() ctx: GraphQLContext): Promise<LLMModel> {
    const llmModelRepository = this.getRepository(ctx);

    // Find the model to set as default
    const modelToSet = await llmModelRepository.findOne({ where: { id } });
    if (!modelToSet) {
      throw new Error(`LLMModel with id "${id}" not found`);
    }

    // Get all models for this connection to unset their default flag
    const allConnectionModels = await llmModelRepository.find({
      where: { connectionId: modelToSet.connectionId }
    });

    // Update all other models to not be default
    for (const model of allConnectionModels) {
      if (model.id !== id && model.default) {
        model.default = false;
        await llmModelRepository.save(model);
      }
    }

    // Set the selected model as default
    modelToSet.default = true;
    await llmModelRepository.save(modelToSet);

    return modelToSet;
  }

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

      // Verify the LLM model with the connection details
      const isValid = await verifyLLMModel(
        connection.baseUrl,
        connection.apiKey,
        connection.kind,
        inputObj.modelIdentifier,
        inputObj.temperature / 100, // Convert from integer (0-100) to decimal (0-1)
        connection.customHeaders || undefined
      );

      if (!isValid) {
        throw new Error(`Failed to verify LLM model "${inputObj.modelIdentifier}" with connection "${connection.name}"`);
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
