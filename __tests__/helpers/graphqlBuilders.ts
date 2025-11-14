/**
 * GraphQL Query/Mutation Builders
 *
 * Utilities for building common GraphQL queries and mutations with standard fields.
 * This eliminates repetitive GraphQL string construction and ensures consistency.
 */

/**
 * Standard field sets for entities
 */
export const fieldSets = {
  minimal: ['id', 'modelId'],
  standard: ['id', 'modelId', 'createdAt', 'updatedAt'],
  full: ['id', 'modelId', 'createdAt', 'updatedAt', 'deletedAt'],

  // Entity-specific field sets
  user: ['id', 'modelId', 'name', 'username', 'createdAt'],
  userFull: ['id', 'modelId', 'name', 'username', 'sessionKey', 'createdAt', 'updatedAt'],

  connection: ['id', 'modelId', 'name', 'provider', 'kind', 'createdAt'],
  connectionFull: ['id', 'modelId', 'name', 'apiKey', 'baseUrl', 'provider', 'kind', 'customHeaders', 'models', 'createdAt', 'updatedAt'],

  llmModel: ['id', 'modelId', 'name', 'maxTokens', 'contextWindow', 'createdAt'],
  llmModelFull: ['id', 'modelId', 'name', 'maxTokens', 'contextWindow', 'description', 'inputCost', 'outputCost', 'createdAt', 'updatedAt'],

  chat: ['id', 'modelId', 'title', 'createdAt'],
  chatFull: ['id', 'modelId', 'title', 'systemPrompt', 'createdAt', 'updatedAt'],

  message: ['id', 'modelId', 'content', 'role', 'createdAt'],
  messageFull: ['id', 'modelId', 'content', 'role', 'metadata', 'tokens', 'createdAt', 'updatedAt'],

  job: ['id', 'modelId', 'name', 'status', 'createdAt'],
  jobFull: ['id', 'modelId', 'name', 'status', 'attempts', 'lastError', 'runAt', 'createdAt', 'updatedAt']
};

/**
 * GraphQL Query Builder with fluent interface
 */
export class QueryBuilder {
  private queryName: string;
  private returnType: string;
  private fields: string[] = [];
  private variables: Record<string, string> = {};
  private arguments: string[] = [];

  constructor(name: string, returnType: string) {
    this.queryName = name;
    this.returnType = returnType;
  }

  /**
   * Add fields to the query
   */
  select(...fields: string[]): QueryBuilder {
    this.fields.push(...fields);
    return this;
  }

  /**
   * Add a field set from fieldSets
   */
  selectFields(fieldSetName: keyof typeof fieldSets): QueryBuilder {
    this.fields.push(...fieldSets[fieldSetName]);
    return this;
  }

  /**
   * Add a variable to the query
   */
  variable(name: string, type: string): QueryBuilder {
    this.variables[name] = type;
    return this;
  }

  /**
   * Add arguments to the query
   */
  arg(name: string, value: string): QueryBuilder {
    this.arguments.push(`${name}: ${value}`);
    return this;
  }

  /**
   * Add nested selection with sub-fields
   */
  nested(path: string, fields: string[]): QueryBuilder {
    const nestedFields = fields.map(field => `  ${field}`).join('\n');
    this.fields.push(`${path} {\n${nestedFields}\n}`);
    return this;
  }

  /**
   * Build the final query string
   */
  build(): string {
    const variableDefinitions = Object.entries(this.variables)
      .map(([name, type]) => `$${name}: ${type}`)
      .join(', ');

    const argsString = this.arguments.length > 0 ? `(${this.arguments.join(', ')})` : '';

    const fieldsString = this.fields.length > 0
      ? '\n        ' + this.fields.join('\n        ') + '\n      '
      : '';

    const query = `query${variableDefinitions ? `(${variableDefinitions})` : ''} {\n        ${this.queryName}${argsString} {${fieldsString}}\n      }`;

    return query;
  }
}

/**
 * GraphQL Mutation Builder with fluent interface
 */
export class MutationBuilder {
  private mutationName: string;
  private returnType: string;
  private fields: string[] = [];
  private variables: Record<string, string> = {};
  private arguments: string[] = [];

  constructor(name: string, returnType: string) {
    this.mutationName = name;
    this.returnType = returnType;
  }

  /**
   * Add fields to the mutation result
   */
  select(...fields: string[]): MutationBuilder {
    this.fields.push(...fields);
    return this;
  }

  /**
   * Add a field set from fieldSets
   */
  selectFields(fieldSetName: keyof typeof fieldSets): MutationBuilder {
    this.fields.push(...fieldSets[fieldSetName]);
    return this;
  }

  /**
   * Add a variable to the mutation
   */
  variable(name: string, type: string): MutationBuilder {
    this.variables[name] = type;
    return this;
  }

  /**
   * Add arguments to the mutation
   */
  arg(name: string, value: string): MutationBuilder {
    this.arguments.push(`${name}: ${value}`);
    return this;
  }

  /**
   * Build the final mutation string
   */
  build(): string {
    const variableDefinitions = Object.entries(this.variables)
      .map(([name, type]) => `$${name}: ${type}`)
      .join(', ');

    const argsString = this.arguments.length > 0 ? `(${this.arguments.join(', ')})` : '';

    const fieldsString = this.fields.length > 0
      ? '\n        ' + this.fields.join('\n        ') + '\n      '
      : '';

    const mutation = `mutation${variableDefinitions ? `(${variableDefinitions})` : ''} {\n        ${this.mutationName}${argsString} {${fieldsString}}\n      }`;

    return mutation;
  }
}

/**
 * Pagination Query Builder
 */
export class PaginationQueryBuilder {
  private entityName: string;
  private fields: string[] = [];
  private includePageInfo: boolean = true;
  private includeEdges: boolean = true;

  constructor(entityName: string) {
    this.entityName = entityName;
  }

  /**
   * Add fields to the node selection
   */
  selectNodeFields(...fields: string[]): PaginationQueryBuilder {
    this.fields.push(...fields);
    return this;
  }

  /**
   * Add a field set for node fields
   */
  selectNodeFieldsSet(fieldSetName: keyof typeof fieldSets): PaginationQueryBuilder {
    this.fields.push(...fieldSets[fieldSetName]);
    return this;
  }

  /**
   * Include or exclude pageInfo
   */
  withPageInfo(include: boolean = true): PaginationQueryBuilder {
    this.includePageInfo = include;
    return this;
  }

  /**
   * Include or exclude edges wrapper
   */
  withEdges(include: boolean = true): PaginationQueryBuilder {
    this.includeEdges = include;
    return this;
  }

  /**
   * Build the paginated query
   */
  build(): string {
    let nodeFields = this.fields.length > 0
      ? '\n            ' + this.fields.join('\n            ') + '\n          '
      : '';

    let query = `query Get${this.capitalize(this.entityName)}($first: Int, $after: String) {\n        ${this.entityName}(first: $first, after: $after) {\n`;

    if (this.includeEdges) {
      query += `          edges {\n            cursor\n            node {${nodeFields}}\n          }\n`;
    }

    if (this.includePageInfo) {
      query += `          pageInfo {\n            hasNextPage\n            hasPreviousPage\n            startCursor\n            endCursor\n          }\n`;
    }

    query += `        }\n      }`;

    return query;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Factory functions for creating common builders
 */
export const queryBuilder = {
  /**
   * Create a basic entity query
   */
  entity: (entityName: string, fields?: string[]) => {
    const builder = new QueryBuilder(entityName, `${entityName}!`);
    if (fields) {
      builder.select(...fields);
    }
    return builder;
  },

  /**
   * Create a query for current user
   */
  currentUser: (fields?: string[]) => {
    const builder = new QueryBuilder('currentUser', 'User!');
    if (fields) {
      builder.select(...fields);
    }
    return builder;
  },

  /**
   * Create a paginated query
   */
  paginated: (entityName: string, nodeFields?: string[]) => {
    const builder = new PaginationQueryBuilder(entityName);
    if (nodeFields) {
      builder.selectNodeFields(...nodeFields);
    }
    return builder;
  }
};

export const mutationBuilder = {
  /**
   * Create a standard create mutation
   */
  create: (entityName: string, resultFields?: string[]) => {
    const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    const builder = new MutationBuilder(`create${capitalizedName}`, `${capitalizedName}!`);
    builder.variable('input', `Create${capitalizedName}Input!`).arg('input', '$input');

    if (resultFields) {
      builder.select(...resultFields);
    }
    return builder;
  },

  /**
   * Create a standard update mutation
   */
  update: (entityName: string, resultFields?: string[]) => {
    const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    const builder = new MutationBuilder(`update${capitalizedName}`, `${capitalizedName}!`);
    builder.variable('input', `Update${capitalizedName}Input!`).arg('input', '$input');

    if (resultFields) {
      builder.select(...resultFields);
    }
    return builder;
  },

  /**
   * Create a standard delete mutation
   */
  delete: (entityName: string) => {
    const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    const builder = new MutationBuilder(`destroy${capitalizedName}`, 'Boolean!');
    builder.variable('id', 'String!').arg('id', '$id');
    return builder;
  }
};

/**
 * Pre-built common queries and mutations
 */
export const commonQueries = {
  /**
   * Get current user
   */
  currentUser: queryBuilder.currentUser(fieldSets.user).build(),

  /**
   * Get connections array
   */
  connectionsArray: queryBuilder.entity('connectionsArray', fieldSets.connection).build(),

  /**
   * Get paginated connections
   */
  connectionsPaginated: queryBuilder.paginated('connections', fieldSets.connection).build(),

  /**
   * Get LLM models for connection
   */
  llmModels: queryBuilder.entity('llmModels', fieldSets.llmModel)
    .variable('connectionId', 'String!')
    .arg('connectionId', '$connectionId')
    .build(),

  /**
   * Get chats for user
   */
  chats: queryBuilder.entity('chats', fieldSets.chat).build(),

  /**
   * Get messages for chat
   */
  messages: queryBuilder.entity('messages', fieldSets.message)
    .variable('chatId', 'String!')
    .arg('chatId', '$chatId')
    .build()
};

export const commonMutations = {
  /**
   * Create connection
   */
  createConnection: mutationBuilder.create('connection', fieldSets.connectionFull).build(),

  /**
   * Update connection
   */
  updateConnection: mutationBuilder.update('connection', fieldSets.connection).build(),

  /**
   * Delete connection
   */
  deleteConnection: mutationBuilder.delete('connection').build(),

  /**
   * Create LLM model
   */
  createLLMModel: mutationBuilder.create('llmModel', fieldSets.llmModelFull).build(),

  /**
   * Update LLM model
   */
  updateLLMModel: mutationBuilder.update('llmModel', fieldSets.llmModel).build(),

  /**
   * Delete LLM model
   */
  deleteLLMModel: mutationBuilder.delete('llmModel').build(),

  /**
   * Create chat
   */
  createChat: mutationBuilder.create('chat', fieldSets.chatFull).build(),

  /**
   * Create message
   */
  createMessage: mutationBuilder.create('message', fieldSets.messageFull).build()
};

/**
 * Utility to combine multiple queries
 */
export class CombinedQueryBuilder {
  private queries: Array<{ name: string; query: string }> = [];

  /**
   * Add a query to the combination
   */
  addQuery(name: string, query: string): CombinedQueryBuilder {
    this.queries.push({ name, query });
    return this;
  }

  /**
   * Add a query builder to the combination
   */
  addQueryBuilder(name: string, builder: QueryBuilder): CombinedQueryBuilder {
    this.queries.push({ name, query: builder.build() });
    return this;
  }

  /**
   * Build the combined query
   */
  build(): string {
    const queryBodies = this.queries.map(q => q.query).join('\n\n');
    return queryBodies;
  }

  /**
   * Build with proper query wrapping
   */
  buildAsSingleQuery(): string {
    const queryContents = this.queries.map(q => {
      // Extract the content inside the outer braces
      const match = q.query.match(/\{[\s\S]*\}/);
      if (match) {
        return match[0];
      }
      return q.query;
    }).join('\n\n');

    return `query CombinedQuery {\n${queryContents.replace(/^\s*query\s*\([^)]*\)\s*\{\s*/, '').replace(/\s*\}\s*$/, '')}\n}`;
  }
}

export const combinedQueries = {
  /**
   * Common dashboard queries
   */
  dashboard: new CombinedQueryBuilder()
    .addQuery('currentUser', commonQueries.currentUser)
    .addQuery('connectionsArray', commonQueries.connectionsArray)
    .addQuery('chats', commonQueries.chats)
    .buildAsSingleQuery(),

  /**
   * Connection management queries
   */
  connectionManagement: new CombinedQueryBuilder()
    .addQuery('connectionsPaginated', commonQueries.connectionsPaginated)
    .addQuery('llmModels', commonQueries.llmModels)
    .buildAsSingleQuery()
};