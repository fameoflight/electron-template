import { Resolver, Query, Arg, ID } from 'type-graphql';
import { DataSourceProvider } from '@base/db/index.js';
import { Node, fromGlobalId } from './Node.js';
import { BaseEntity } from '@base/db/index.js';

/**
 * Generic Node resolver for Relay's Global Object Identification
 * Allows refetching any BaseEntity entity by its global ID without hardcoding
 */
@Resolver(() => Node)
export class NodeResolver {
  @Query(() => Node, { nullable: true })
  async node(@Arg('id', () => ID) globalId: string): Promise<BaseEntity | null> {
    try {
      // Decode the global ID to get type and local ID
      const { type, id } = fromGlobalId(globalId);

      // Get the data source and find entity by type name
      const dataSource = DataSourceProvider.get();
      const entityMetadata = dataSource.entityMetadatas.find(
        metadata => metadata.targetName === type || metadata.tableName === type
      );

      if (!entityMetadata) {
        console.warn(`No entity found for type: ${type}`);
        return null;
      }

      // Get the repository directly
      const repository = dataSource.getRepository(entityMetadata.target);

      // Find the entity and manually set __typename
      const entity = await repository.findOne({ where: { id } });

      if (entity && 'id' in entity) {
        // Set the __typename for GraphQL type resolution
        // @ts-ignore - Dynamic property assignment required for GraphQL
        (entity as any).__typename = type;
        return entity as BaseEntity;
      }

      return null;
    } catch (error) {
      console.error('Error fetching node:', error);
      return null;
    }
  }
}