/**
 * ConnectionResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from ConnectionResolverBase):
 * - Queries: connection(id), connections(args), connectionsArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput()(from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { ConnectionResolverBase } from './__generated__/ConnectionResolverBase.js';
import { Connection } from '@db/entities/Connection.js';
import { fetchModels } from '@shared/utils.js';

@Resolver(() => Connection)
export class ConnectionResolver extends ConnectionResolverBase {
  protected async validateInput<T>(input: T): Promise<T> {
    // Only fetch models if this is a create operation or all required fields are provided
    const inputObj = input as any;
    if (inputObj.baseUrl && inputObj.apiKey && inputObj.kind) {
      const models = await fetchModels(
        inputObj.baseUrl,
        inputObj.apiKey,
        inputObj.kind,
        inputObj.customHeaders
      );

      if (models.length === 0) {
        throw new Error('No models found with provided connection settings.');
      }

      inputObj.models = models;
    }

    return await super.validateInput(input);
  }
}
