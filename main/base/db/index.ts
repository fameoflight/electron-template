/**
 * Database infrastructure exports
 *
 * These are the core database components that should be reusable
 * across different applications built with this template.
 */

export { BaseEntity } from './BaseEntity.js';
export { OwnedEntity } from './OwnedEntity.js';
export { default as DataSourceProvider } from './DataSourceProvider.js';
export { SmartLoadingSubscriber } from './subscribers/SmartLoadingSubscriber.js';