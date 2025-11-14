import { PayloadError } from 'relay-runtime';
import type DataLoader from 'dataloader';

export interface GraphQLVariables {
  [key: string]: unknown;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors: PayloadError[]
  extensions?: Record<string, unknown>;
}

export interface GraphQLContext {
  user: null | {
    id: string;
    username: string;
    name: string;
  };

  /**
   * DataLoader instances cached per-request for N+1 prevention
   * Automatically populated by BaseResolver helper methods
   */
  loaders?: Record<string, DataLoader<any, any>>;
}