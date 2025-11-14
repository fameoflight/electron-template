import { registerEnumType } from 'type-graphql';

export enum ListKind {
  DEFAULT = 'default',  // Only active records (excludes soft-deleted)
  ALL = 'all'         // Include soft-deleted records
}

registerEnumType(ListKind, {
  name: 'ListKind',
  description: 'Controls whether to include soft-deleted records in list results'
});