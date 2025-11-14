import { Resolver, FieldResolver, Root } from 'type-graphql';
import { BaseEntity } from '@base/db/index.js';
import { toGlobalId } from './Node';

/**
 * Field resolver that converts local database IDs to Relay global IDs
 * This resolver intercepts the 'id' field for all entities that extend BaseEntity
 * Works generically without hardcoding specific entity types
 */
@Resolver(() => BaseEntity)
export class NodeFieldResolver {
  @FieldResolver(() => String)
  id(@Root() entity: BaseEntity): string {
    // Determine the type name from the entity
    const typeName = this.getTypeName(entity);
    // Convert local ID to global ID
    return toGlobalId(typeName, entity.id);
  }

  private getTypeName(entity: BaseEntity): string {
    // Check if __typename is set (preferred method)
    if (entity.__typename) {
      return entity.__typename;
    }

    // Fallback to constructor name
    return entity.constructor.name;
  }
}
