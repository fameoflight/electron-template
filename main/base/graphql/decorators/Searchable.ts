import 'reflect-metadata';

export interface SearchableOptions {
  fields: string[];
  tableName?: string;
}

const SEARCHABLE_METADATA_KEY = Symbol('searchable');

export function Searchable(options: SearchableOptions): ClassDecorator {
  return function(target: any) {
    Reflect.defineMetadata(SEARCHABLE_METADATA_KEY, options, target);
  };
}

export function getSearchableMetadata(target: any): SearchableOptions | undefined {
  return Reflect.getMetadata(SEARCHABLE_METADATA_KEY, target);
}