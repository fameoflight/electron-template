/**
 * EntityGenerator - Generate TypeScript entities from JSON schemas
 *
 * Focused generator that creates only entity files:
 * 1. Base entity class in main/db/entities/__generated__/ (regenerated each time)
 * 2. Extension stub in main/db/entities/ (for custom business logic)
 *
 * Uses modular architecture with focused components:
 * - TemplateManager: Handles template loading and compilation
 * - FieldPreparator: Prepares field/relationship data for templates
 * - EntityFileGenerator: Handles file operations
 * - TypeMapper: Type conversion utilities
 * - ValidationHelper: Validation logic
 *
 * For inputs and resolvers, use EntityInputGenerator and ResolverGenerator respectively.
 */

import { ParsedEntity, EntityField } from '../parsers/EntityJsonParser.js';
import { TemplateManager } from './managers/TemplateManager.js';
import { FieldPreparator } from './preparators/FieldPreparator.js';
import { EntityFileGenerator } from './generators/EntityFileGenerator.js';
import { PathGenerator } from './generators/PathGenerator.js';
import { ResolverPathGenerator } from './generators/ResolverPathGenerator.js';
import { TypeMapper } from './utils/TypeMapper.js';
import { ValidationHelper } from './utils/ValidationHelper.js';
import { SimplifiedSchemaGenerator } from '../utils/SimplifiedSchemaGenerator.js';
import { output } from '../utils/output.js';

export class EntityGenerator {
  private entity: ParsedEntity;
  private projectRoot: string;
  private templateManager: TemplateManager;
  private fieldPreparator: FieldPreparator;
  private fileGenerator: EntityFileGenerator;
  private pathGenerator: PathGenerator;
  private resolverPathGenerator: ResolverPathGenerator;
  private schemaGenerator: SimplifiedSchemaGenerator;

  constructor(entity: ParsedEntity, projectRoot: string = process.cwd(), outputDir?: string) {
    // Validate that User entity is not processed by automatic generation
    if (entity.name === 'User') {
      throw new Error('❌ User entity should not be processed by automatic generation.\n' +
        'The User entity should be implemented manually using raw TypeORM and TypeGraphQL.\n' +
        'User entity requires special handling for authentication and should not use the ownership abstraction.\n' +
        'Please create the User entity manually in main/db/entities/User.ts');
    }

    // Validate that userId is not defined in JSON schema (inherited from BaseEntity)
    const userIdField = entity.fields.find(field => field.name === 'userId');
    if (userIdField) {
      throw new Error('❌ userId field should not be defined in JSON schema.\n' +
        `The userId field is automatically inherited from BaseEntity for ${entity.name} entity.\n` +
        'Please remove the userId field from your JSON schema.\n' +
        'The ownership functionality will be handled automatically by the RelayRepository.');
    }

    this.entity = entity;
    this.projectRoot = projectRoot;
    this.templateManager = new TemplateManager(projectRoot);
    this.fieldPreparator = new FieldPreparator(entity);
    this.fileGenerator = new EntityFileGenerator(projectRoot, outputDir);
    this.pathGenerator = new PathGenerator(projectRoot);
    this.resolverPathGenerator = new ResolverPathGenerator(projectRoot);
    this.schemaGenerator = new SimplifiedSchemaGenerator(entity);
  }

  /**
   * Generate entity files (base + extension) and update paths
   */
  async generate(force: boolean = false): Promise<{
    basePath: string;
    extensionPath: string;
    extensionCreated: boolean;
    entityPathsPath: string;
    resolverPathsPath: string;
  }> {
    // Validate entity schema for potential issues
    this.validateEntitySchema();

    // Note: We always generate entities regardless of graphql: false
    // because entities may be needed internally for database operations
    // GraphQL exposure is controlled at the resolver and input level
    const basePath = this.generateBaseEntity();
    output.success(`Generated entity base class at ${basePath}`);
    const { path: extensionPath, created: extensionCreated } = this.generateEntityExtension(force);
    const entityPathsPath = await this.generateEntityPaths();
    const resolverPathsPath = await this.generateResolverPaths();

    return { basePath, extensionPath, extensionCreated, entityPathsPath, resolverPathsPath };
  }


  /**
   * Generate the base entity class (regenerated each time)
   */
  private generateBaseEntity(): string {
    const className = this.entity.name;

    const data = this.prepareEntityTemplateData();
    const code = this.templateManager.render('base', data);

    // Generate and inject JSDoc formatted schema using handlebars template
    const schemaData = this.schemaGenerator.generateSchemaData();
    const schema = this.templateManager.render('simplified-schema', schemaData);
    const codeWithSchema = code.replace(
      /^(\/\*\*[\s\S]*?\*\/\n\n)/,
      (match, header) => {
        if (schema) {
          return header + schema + '\n\n';
        }
        return header;
      }
    );

    return this.fileGenerator.generateBaseEntity(className, codeWithSchema);
  }

  /**
   * Generate extension stub (only if doesn't exist, unless force=true)
   */
  private generateEntityExtension(force: boolean = false): { path: string; created: boolean } {
    const className = this.entity.name;
    const data = {
      className,
      tableName: TypeMapper.getTableName(className),
      description: this.entity.description,
      indexes: this.prepareIndexes(),
    };

    const code = this.templateManager.render('extension', data);
    return this.fileGenerator.generateEntityExtension(className, code, force);
  }

  /**
   * Generate entityPaths.ts file
   */
  private async generateEntityPaths(): Promise<string> {
    return await this.pathGenerator.generate();
  }

  /**
   * Generate resolverPaths.ts file
   */
  private async generateResolverPaths(): Promise<string> {
    return await this.resolverPathGenerator.generate();
  }


  /**
   * Prepare template data for entity base class
   */
  private prepareEntityTemplateData() {
    const className = this.entity.name;

    const regularFields = this.entity.fields.filter(f => !f.relationship);
    const relationshipFields = this.entity.fields.filter(f => f.relationship);
    const polymorphicFields = this.entity.fields.filter(f => f.type === 'polymorphic');

    // Sort fields alphabetically by name for consistent ordering
    regularFields.sort((a, b) => a.name.localeCompare(b.name));
    relationshipFields.sort((a, b) => a.name.localeCompare(b.name));
    const enumFields = regularFields.filter(f => f.type === 'enum');
    const jsonFieldsWithItemSchema = regularFields.filter(f => f.type === 'json' && f.array && f.itemSchema);
    // Include regular JSON fields with schemas (non-array)
    const jsonFieldsWithSchema = regularFields.filter(f => f.type === 'json' && !f.array && f.schema);
    // Include all scalar arrays (using FieldColumnJSON for SQLite compatibility)
    const scalarArrayFields = regularFields.filter(f =>
      (f.type === 'string' || f.type === 'number' || f.type === 'boolean') && f.array
    );
    const jsonArrayFields = [...jsonFieldsWithItemSchema, ...scalarArrayFields];
    const allJsonFields = [...jsonArrayFields, ...jsonFieldsWithSchema];

    return {
      className,
      tableName: TypeMapper.getTableName(className),
      description: this.entity.description,
      imports: this.prepareImports(regularFields, relationshipFields),
      indexes: this.prepareIndexes(),
      fields: this.fieldPreparator.prepareEntityFields(),
      relationships: this.fieldPreparator.prepareRelationshipFields(),
      hasRelationships: relationshipFields.length > 0,
      hasEnums: enumFields.length > 0,
      enums: this.fieldPreparator.prepareEnums(),
      hasJsonInterfaces: allJsonFields.length > 0,
      jsonInterfaces: this.prepareJsonInterfaces(allJsonFields),
      zodSchemas: this.prepareZodSchemas(allJsonFields),
      hasPolymorphic: polymorphicFields.length > 0,
      polymorphicMethods: this.fieldPreparator.getPolymorphicFields(),
    };
  }


  /**
   * Prepare interface definitions for JSON fields with itemSchema and regular JSON fields with schemas
   */
  private prepareJsonInterfaces(jsonFields: EntityField[]): Array<{ name: string; definition: string }> {
    return jsonFields.map(field => {
      // Handle JSON arrays with itemSchema
      if (field.array && field.itemSchema) {
        return {
          name: TypeMapper.getItemSchemaInterfaceName(this.entity.name, field.name),
          definition: TypeMapper.getItemSchemaInterfaceDefinition(
            this.entity.name,
            field.name,
            field.itemSchema!
          )
        };
      }

      // Handle regular JSON fields with schemas (non-array)
      if (!field.array && field.schema) {
        return {
          name: TypeMapper.getItemSchemaInterfaceName(this.entity.name, field.name),
          definition: TypeMapper.getItemSchemaInterfaceDefinition(
            this.entity.name,
            field.name,
            field.schema
          )
        };
      }

      // Skip other fields
      return null;
    }).filter((item): item is { name: string; definition: string } => item !== null);
  }


  /**
   * Prepare Zod schema definitions for JSON fields with itemSchema, scalar arrays, and regular JSON fields with schemas
   */
  private prepareZodSchemas(jsonFields: EntityField[]): Array<{ name: string; definition: string, description?: string }> {
    return jsonFields.map(field => {
      const schemaName = `${this.entity.name}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}Schema`;

      // Handle scalar arrays (string, number, boolean)
      if ((field.type === 'string' || field.type === 'number' || field.type === 'boolean') && field.array) {
        return {
          name: schemaName,
          description: field.description,
          definition: TypeMapper.getScalarArraySchemaDefinition(
            this.entity.name,
            field.name,
            field.type,
            field.arrayOptions
          )
        };
      }

      // Handle JSON arrays with itemSchema
      if (field.array && field.itemSchema) {
        return {
          name: schemaName,
          description: field.description,
          definition: TypeMapper.getItemSchemaZodDefinition(
            this.entity.name,
            field.name,
            field.itemSchema!
          )
        };
      }

      // Handle regular JSON fields with schemas (non-array)
      if (!field.array && field.schema) {
        return {
          name: schemaName,
          definition: TypeMapper.getDeepJsonSchemaDefinition(this.entity.name, field.name, field.schema),
          description: field.description
        };
      }

      // Skip schema generation for fields without schemas (they will use z.any() directly)
      return null;
    }).filter((item): item is { name: string; definition: string, description: string } => item !== null);
  }


  /**
   * Prepare imports for entity
   * Simplified to only handle dynamic relationship imports
   */
  private prepareImports(
    regularFields: EntityField[],
    relationshipFields: EntityField[]
  ): string[] {
    const imports: string[] = [];

    // Only generate relationship entity imports (everything else is hardcoded)
    const relationshipEntities = this.fieldPreparator.getRelationshipTargets();
    for (const entityName of relationshipEntities) {
      imports.push(`import { ${entityName} } from '../${entityName}.js';`);
    }

    return imports;
  }

  /**
   * Prepare indexes for entity
   */
  private prepareIndexes(): string[] {
    if (!this.entity.indexes || this.entity.indexes.length === 0) {
      return [];
    }

    return this.entity.indexes.map(idx => {
      if (Array.isArray(idx)) {
        // Composite index - create named index with column array
        const indexName = `IDX_${this.entity.name.toLowerCase()}_${idx.join('_')}`;
        return `@Index("${indexName}", ['${idx.join("', '")}'])`;
      }
      // Single column index - create named index with column array
      const indexName = `IDX_${this.entity.name.toLowerCase()}_${idx}`;
      return `@Index("${indexName}", ['${idx}'])`;
    });
  }

  /**
   * Validate entity schema for potential migration issues
   */
  private validateEntitySchema(): void {
    const problematicFields: Array<{ name: string; type: string }> = [];

    for (const field of this.entity.fields) {
      // Check for NOT NULL fields without defaults (only for database columns)
      if (field.required && !field.defaultValue) {
        if (field.type == 'relation') {
          continue; // Skip relationship fields
        }
        problematicFields.push({ name: field.name, type: field.type || 'unknown' });
      }
    }

    // Show one compact warning per entity with field list
    if (problematicFields.length > 0) {
      const fieldNames = problematicFields.map(f => f.name).join(', ');
      output.warning(`⚠️  Entity "${this.entity.name}" has ${problematicFields.length} NOT NULL field${problematicFields.length === 1 ? '' : 's'} without defaults`);
      output.info(`   ⋮ ${fieldNames}`);
      output.info(`   💡 Consider adding default values or making fields nullable to avoid migration failures`);
      output.info('');
    }
  }
}