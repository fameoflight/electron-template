/**
 * Connection Factory for Testing
 *
 * Provides factory functions to create Connection entities for testing
 */

import { DataSource } from 'typeorm';
import { Connection } from '@db/entities/Connection';
import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase';
import { createEntityWithDelay, createEntitiesWithDelay } from './entityFactory';

/**
 * Create a single connection test entity
 */
export async function createConnection(
  dataSource: DataSource,
  overrides: Partial<Connection> = {}
): Promise<Connection> {
  // If userId is not provided in overrides, we can't create a connection
  // due to foreign key constraints. The caller must provide a valid userId.
  if (!overrides.userId) {
    throw new Error('userId must be provided to createConnection due to foreign key constraints');
  }

  const defaultData: Partial<Connection> = {
    name: 'Test Connection',
    apiKey: 'not-required',
    baseUrl: 'http://localhost:1234/v1',
    kind: ConnectionKind.OPENAI,
    provider: 'OpenAI',
    customHeaders: {
      'Content-Type': 'application/json'
    }
  };

  const connectionData = { ...defaultData, ...overrides };

  // Create a context object with the userId to avoid the fallback 'test-user-id'
  const context = { user: { id: overrides.userId } };

  return await createEntityWithDelay(dataSource, Connection, connectionData, context);
}

/**
 * Create multiple connection test entities
 */
export async function createConnections(
  dataSource: DataSource,
  count: number,
  baseOverrides: Partial<Connection> = {}
): Promise<Connection[]> {
  // Ensure userId is provided in baseOverrides due to foreign key constraints
  if (!baseOverrides.userId) {
    throw new Error('userId must be provided in baseOverrides to createConnections due to foreign key constraints');
  }

  const connections = Array.from({ length: count }, (_, i) => ({
    name: `Test Connection ${i + 1}`,
    apiKey: 'not-required',
    baseUrl: 'http://localhost:1234/v1',
    kind: ConnectionKind.OPENAI,
    provider: 'OpenAI',
    customHeaders: {
      'Content-Type': 'application/json'
    },
    ...baseOverrides
  }));

  // Create a context object with the userId to avoid the fallback 'test-user-id'
  const context = { user: { id: baseOverrides.userId } };

  return await createEntitiesWithDelay(dataSource, Connection, connections, context);
}

/**
 * Create connections with different kinds (OpenAI, Anthropic)
 */
export async function createConnectionsOfDifferentKinds(
  dataSource: DataSource,
  userId: string
): Promise<Connection[]> {
  const connections = [
    {
      name: 'OpenAI Connection',
      apiKey: 'not-required',
      baseUrl: 'http://localhost:1234/v1',
      kind: ConnectionKind.OPENAI,
      provider: 'OpenAI',
      userId,
      customHeaders: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Anthropic Connection',
      apiKey: 'not-required',
      baseUrl: 'http://localhost:1234/v1',
      kind: ConnectionKind.ANTHROPIC,
      provider: 'Anthropic',
      userId,
      customHeaders: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Custom API Connection',
      apiKey: 'not-required',
      baseUrl: 'http://localhost:1234/v1',
      kind: ConnectionKind.OPENAI,
      provider: 'Custom Provider',
      userId,
      customHeaders: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123'
      }
    }
  ];

  // Create a context object with the userId to avoid the fallback 'test-user-id'
  const context = { user: { id: userId } };

  return await createEntitiesWithDelay(dataSource, Connection, connections, context);
}