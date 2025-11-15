/**
 * Tests for graphql operations functionality in resolver generation
 */

import { EntityJsonParser } from '@cli/parsers/EntityJsonParser';
import { EntityGenerator } from '@cli/generators/EntityGenerator';
import { GeneratorFactory } from '@cli/generators/GeneratorFactory';
import { getProjectRoot, getTempDir } from '@tests/base/utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Entity Generator - GraphQL Operations', () => {
  const tempDir = getTempDir('operations-exclude');
  const projectRoot = getProjectRoot();

  beforeEach(() => {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('GraphQL Array Operations - Include/Exclude', () => {
    it('should exclude update operation when using graphql array', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'ReadOnlyEntity',
        graphql: ['create', 'createUpdate', 'delete', 'destroy', 'list', 'array', 'single'], // exclude 'update'
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that update method is excluded
      expect(generatedContent).not.toContain('async updateReadOnlyEntity(');
      expect(generatedContent).not.toContain('@Mutation(() => ReadOnlyEntity, { description: \'Update existing ReadOnlyEntity\' })');

      // Check that other methods are present
      expect(generatedContent).toContain('async createReadOnlyEntity(');
      expect(generatedContent).toContain('async createUpdateReadOnlyEntity(');
      expect(generatedContent).toContain('async destroyReadOnlyEntity(');
      expect(generatedContent).toContain('async deleteReadOnlyEntity(');
    });

    it('should exclude create operation', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'ImmutableEntity',
        graphql: ['createUpdate', 'update', 'delete', 'destroy', 'list', 'array', 'single'], // exclude 'create'
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that create method is excluded
      expect(generatedContent).not.toContain('async createImmutableEntity(');
      expect(generatedContent).not.toContain('@Mutation(() => ImmutableEntity, { description: \'Create new ImmutableEntity\' })');

      // Check that other methods are present
      expect(generatedContent).toContain('async updateImmutableEntity(');
      expect(generatedContent).toContain('async createUpdateImmutableEntity(');
    });

    it('should exclude delete operation', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'PermanentEntity',
        graphql: ['create', 'createUpdate', 'update', 'destroy', 'list', 'array', 'single'], // exclude 'delete'
        fields: {
          title: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that delete method is excluded
      expect(generatedContent).not.toContain('async deletePermanentEntity(');
      expect(generatedContent).not.toContain('@Mutation(() => Boolean, { description: \'Hard delete PermanentEntity (permanent)\' })');

      // Check that destroy is still present
      expect(generatedContent).toContain('async destroyPermanentEntity(');
    });

    it('should exclude destroy operation', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'NoSoftDeleteEntity',
        graphql: ['create', 'createUpdate', 'update', 'delete', 'list', 'array', 'single'], // exclude 'destroy'
        fields: {
          title: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that destroy method is excluded
      expect(generatedContent).not.toContain('async destroyNoSoftDeleteEntity(');
      expect(generatedContent).not.toContain('@Mutation(() => Boolean, { description: \'Soft delete NoSoftDeleteEntity\' })');

      // Check that delete is still present
      expect(generatedContent).toContain('async deleteNoSoftDeleteEntity(');
    });

    it('should exclude list operation', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'NoPaginationEntity',
        graphql: ['create', 'createUpdate', 'update', 'delete', 'destroy', 'array', 'single'], // exclude 'list'
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that list method is excluded
      expect(generatedContent).not.toContain('async noPaginationEntities(');
      expect(generatedContent).not.toContain('@Query(() => NoPaginationEntityConnection, { description: \'Fetch NoPaginationEntity collection (paginated)\' })');

      // Check that single query is still present
      expect(generatedContent).toContain('async noPaginationEntity(');
    });

    it('should exclude single operation', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'CollectionEntity',
        graphql: ['create', 'createUpdate', 'update', 'delete', 'destroy', 'list', 'array'], // exclude 'single'
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that single method is excluded
      expect(generatedContent).not.toContain('async collectionEntity(');
      expect(generatedContent).not.toContain('@Query(() => CollectionEntity, { nullable: true, description: \'Fetch CollectionEntity by ID\' })');

      // Check that list query is still present
      expect(generatedContent).toContain('async collectionEntities(');
    });

    it('should exclude array operation', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'PaginatedOnlyEntity',
        graphql: ['create', 'createUpdate', 'update', 'delete', 'destroy', 'list', 'single'], // exclude 'array'
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that array method is excluded
      expect(generatedContent).not.toContain('async paginatedOnlyEntitiesArray(');
      expect(generatedContent).not.toContain('@Query(() => [PaginatedOnlyEntity], { description: \'Fetch PaginatedOnlyEntity array\' })');

      // Check that list query is still present
      expect(generatedContent).toContain('async paginatedOnlyEntities(');
    });
  });

  describe('Multiple Operations Exclusion', () => {
    it('should exclude multiple operations', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'ReadOnlyEntity',
        graphql: ['createUpdate', 'destroy', 'list', 'array', 'single'], // exclude 'create', 'update', 'delete'
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that mutations are excluded
      expect(generatedContent).not.toContain('async createReadOnlyEntity(');
      expect(generatedContent).not.toContain('async updateReadOnlyEntity(');
      expect(generatedContent).not.toContain('async deleteReadOnlyEntity(');

      // Check that read-only operations are present
      expect(generatedContent).toContain('async readOnlyEntity(');
      expect(generatedContent).toContain('async readOnlyEntities(');
      expect(generatedContent).toContain('async readOnlyEntitiesArray(');
      expect(generatedContent).toContain('async destroyReadOnlyEntity('); // soft delete still available
    });

    it('should exclude all mutations except createUpdate', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'UpsertOnlyEntity',
        graphql: ['createUpdate', 'list', 'array', 'single'], // exclude 'create', 'update', 'destroy', 'delete'
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that individual mutations are excluded
      expect(generatedContent).not.toContain('async createUpsertOnlyEntity(');
      expect(generatedContent).not.toContain('async updateUpsertOnlyEntity(');
      expect(generatedContent).not.toContain('async destroyUpsertOnlyEntity(');
      expect(generatedContent).not.toContain('async deleteUpsertOnlyEntity(');

      // Check that createUpdate is still present
      expect(generatedContent).toContain('async createUpdateUpsertOnlyEntity(');
    });
  });

  describe('No Operations Excluded', () => {
    it('should generate all operations when exclude is not specified', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'FullEntity',
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that all operations are present
      expect(generatedContent).toContain('async fullEntity('); // single
      expect(generatedContent).toContain('async fullEntities('); // list
      expect(generatedContent).toContain('async fullEntitiesArray('); // array
      expect(generatedContent).toContain('async createFullEntity('); // create
      expect(generatedContent).toContain('async updateFullEntity('); // update
      expect(generatedContent).toContain('async createUpdateFullEntity('); // createUpdate
      expect(generatedContent).toContain('async destroyFullEntity('); // destroy
      expect(generatedContent).toContain('async deleteFullEntity('); // delete
    });
  });

  describe('GraphQL Array Parsing', () => {
    it('should parse graphql array correctly', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        graphql: ['create', 'update', 'delete'],
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toEqual(['create', 'update', 'delete']);
    });

    it('should handle empty graphql array', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        graphql: [],
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toEqual([]);
    });

    it('should handle missing graphql field', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toBeUndefined();
    });
  });

  describe('GraphQL Boolean Control', () => {
    it('should exclude all operations when graphql: false', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'NoGraphQLEntity',
        graphql: false,
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toBe(false);
    });

    it('should include all operations when graphql: true', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'FullGraphQLEntity',
        graphql: true,
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toBe(true);
    });

    it('should include all operations when graphql is not specified', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'DefaultGraphQLEntity',
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toBeUndefined();
    });
  });

  describe('GraphQL Array Operations - Granular Control', () => {
    it('should include only create operation when graphql: ["create"]', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'CreateOnlyEntity',
        graphql: ['create'],
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));
      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that only create method is present
      expect(generatedContent).toContain('async createCreateOnlyEntity(');
      expect(generatedContent).toContain('@FieldMutation(CreateCreateOnlyEntityInput,');

      // Check that other methods are excluded
      expect(generatedContent).not.toContain('async updateCreateOnlyEntity(');
      expect(generatedContent).not.toContain('async createUpdateCreateOnlyEntity(');
      expect(generatedContent).not.toContain('async destroyCreateOnlyEntity(');
      expect(generatedContent).not.toContain('async deleteCreateOnlyEntity(');
      expect(generatedContent).not.toContain('async createOnlyEntity('); // single
      expect(generatedContent).not.toContain('async createOnlyEntities('); // list
      expect(generatedContent).not.toContain('async createOnlyEntitiesArray('); // array
    });

    it('should include only read operations when graphql: ["single", "list", "array"]', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'ReadOnlyEntity',
        graphql: ['single', 'list', 'array'],
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));
      const factory = new GeneratorFactory({ projectRoot, outputDir: tempDir });
      const result = await factory.generateAll(parsed);

      expect(result.resolver).toBeDefined();
      const generatedContent = fs.readFileSync(result.resolver!.resolverPath, 'utf8');

      // Check that read operations are present
      expect(generatedContent).toContain('async readOnlyEntity(');
      expect(generatedContent).toContain('async readOnlyEntities(');
      expect(generatedContent).toContain('async readOnlyEntitiesArray(');

      // Check that all mutations are excluded
      expect(generatedContent).not.toContain('async createReadOnlyEntity(');
      expect(generatedContent).not.toContain('async updateReadOnlyEntity(');
      expect(generatedContent).not.toContain('async createUpdateReadOnlyEntity(');
      expect(generatedContent).not.toContain('async destroyReadOnlyEntity(');
      expect(generatedContent).not.toContain('async deleteReadOnlyEntity(');
    });
  });
});