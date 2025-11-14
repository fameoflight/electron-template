/**
 * GraphQLOptions - Utility for parsing GraphQL field options
 *
 * Handles the different formats for GraphQL exposure control:
 * - graphql: false - No GraphQL generation
 * - graphql: true - Default GraphQL generation (all applicable)
 * - graphql: ['object', 'inputs', 'foreignKey', 'relation'] - Granular control
 */

import { EntityField } from '../../parsers/EntityJsonParser.js';

export type GraphQLOption = 'object' | 'inputs' | 'foreignKey' | 'relation';

export class GraphQLOptions {
  private field: EntityField;
  private options: Set<GraphQLOption>;

  constructor(field: EntityField) {
    this.field = field;
    this.options = this.parseOptions();
  }

  /**
   * Parse GraphQL options from field configuration
   */
  private parseOptions(): Set<GraphQLOption> {
    const graphql = this.field.graphql;

    // graphql: false - No GraphQL generation
    if (graphql === false) {
      return new Set();
    }

    // graphql: true or undefined - Default GraphQL generation
    if (graphql === true || graphql === undefined) {
      const defaults: GraphQLOption[] = ['object', 'inputs'];

      // Add relation-specific options for relation fields
      if (this.field.relationship) {
        defaults.push('foreignKey', 'relation');
      }

      return new Set(defaults);
    }

    // graphql: ['object', 'inputs', 'foreignKey', 'relation'] - Granular control
    if (Array.isArray(graphql)) {
      return new Set(graphql as GraphQLOption[]);
    }

    // Default fallback
    return new Set(['object', 'inputs']);
  }

  /**
   * Check if object type GraphQL should be generated
   */
  shouldGenerateObject(): boolean {
    return this.options.has('object');
  }

  /**
   * Check if input types GraphQL should be generated
   */
  shouldGenerateInputs(): boolean {
    return this.options.has('inputs');
  }

  /**
   * Check if foreign key GraphQL should be generated (relation fields only)
   */
  shouldGenerateForeignKey(): boolean {
    return this.options.has('foreignKey') && !!this.field.relationship;
  }

  /**
   * Check if relation GraphQL should be generated (relation fields only)
   */
  shouldGenerateRelation(): boolean {
    return this.options.has('relation') && !!this.field.relationship;
  }

  /**
   * Check if any GraphQL generation should happen
   */
  shouldGenerateAny(): boolean {
    return this.options.size > 0;
  }

  /**
   * Get all enabled options
   */
  getEnabledOptions(): GraphQLOption[] {
    return Array.from(this.options);
  }

  /**
   * Legacy compatibility methods for existing code
   */
  shouldIncludeGraphQL(part: 'foreignKey' | 'relation'): boolean {
    if (part === 'foreignKey') {
      return this.shouldGenerateForeignKey();
    }
    if (part === 'relation') {
      return this.shouldGenerateRelation();
    }
    return false;
  }
}