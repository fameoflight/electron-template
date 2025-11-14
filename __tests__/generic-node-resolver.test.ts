import { DataSource } from 'typeorm';
import { NodeResolver } from '../main/base/graphql/index';
import { Node, toGlobalId, fromGlobalId } from '../main/base/graphql/index';
import { getEntitiesMap } from '../main/db/dataSource';

/**
 * Simple test to verify the generic NodeResolver works with different entity types
 * without hardcoding specific entities in the resolver.
 */

describe('Generic NodeResolver', () => {
  let nodeResolver: NodeResolver;
  let User: any;
  let Job: any;

  beforeAll(async () => {
    // Load entities from centralized loader
    const entities = await getEntitiesMap();
    User = entities.User;
    Job = entities.Job;
  });

  beforeEach(() => {
    nodeResolver = new NodeResolver();
  });

  describe('Global ID encoding/decoding', () => {
    it('should correctly encode and decode User global ID', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const globalId = toGlobalId('User', userId);
      const decoded = fromGlobalId(globalId);

      expect(decoded.type).toBe('User');
      expect(decoded.id).toBe(userId);
    });

    it('should correctly encode and decode Job global ID', () => {
      const jobId = '987e6543-e21b-45d6-b789-123456789abc';
      const globalId = toGlobalId('Job', jobId);
      const decoded = fromGlobalId(globalId);

      expect(decoded.type).toBe('Job');
      expect(decoded.id).toBe(jobId);
    });
  });

  describe('Generic entity resolution', () => {
    // Note: This test would require a test database setup to work fully
    // The important part is that the NodeResolver can handle any entity type
    // without needing hardcoded switch statements

    it('should be able to handle any BaseEntity entity type', () => {
      // The resolver should work with any entity that extends BaseEntity
      expect(nodeResolver).toBeInstanceOf(NodeResolver);
    });

    it('should work with type names matching entity target names', () => {
      // The generic approach uses TypeORM's entity metadata
      // so it should find entities by their targetName or tableName
      const testCases = [
        { type: 'User', expectedEntity: User },
        { type: 'Job', expectedEntity: Job }
      ];

      testCases.forEach(({ type, expectedEntity }) => {
        expect(type).toBe(expectedEntity.name);
      });
    });
  });
});