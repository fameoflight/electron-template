import { createGraphQLSchema } from '../main/graphql/schema';

describe('GraphQL Schema', () => {
  it('should build schema successfully with generic NodeResolver', async () => {
    const schema = await createGraphQLSchema();
    expect(schema).toBeDefined();

    // Verify that the Node query is available
    const nodeQuery = schema.getQueryType()?.getFields().node;
    expect(nodeQuery).toBeDefined();
    expect(nodeQuery?.type).toBeDefined();
  });
});