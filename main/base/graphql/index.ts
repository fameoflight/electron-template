/**
 * GraphQL infrastructure exports
 *
 * Base GraphQL components including resolvers, Relay integration,
 * and type definitions that should be reusable across applications.
 */

export { BaseResolver } from './BaseResolver.js';
export { BaseInput } from './BaseInput.js';
export { Node, toGlobalId, fromGlobalId, fromGlobalIdToLocalId } from './relay/Node.js';
export { CustomRepository } from '../CustomRepository.js';
export { OwnedRepository } from './relay/OwnedRepository.js';
// Backward compatibility alias - @deprecated Use OwnedRepository instead
export { OwnedRepository as RelayRepository } from './relay/OwnedRepository.js';
export { createConnectionType, createEdgeType, toCursor, fromCursor, connectionFromArray, PageInfo, ConnectionArgs } from './relay/Connection.js';
export { NodeFieldResolver } from './relay/NodeFieldResolver.js';
export { NodeResolver } from './relay/NodeResolver.js';
export { DataLoaderFactory } from './DataLoaderFactory.js';
export {
  EagerLoad,
  getEagerLoadRelations,
  getEagerLoadConfig,
  shouldEagerLoad,
  type EagerLoadOptions
} from './decorators/EagerLoad.js';
export {
  withOptionalId,
  withRequiredId,
  getInputVariants,
  getInputType,
  clearInputCache
} from './decorators/InputTypeHelpers.js';
export {
  FieldMutation,
  type FieldMutationOptions
} from './decorators/FieldMutation.js';

