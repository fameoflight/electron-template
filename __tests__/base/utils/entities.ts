/**
 * Test helper file for importing all database entities
 *
 * This file provides a convenient way to import all entities in test files
 * without having to manage multiple import statements.
 *
 * NOW USING CENTRALIZED ENTITYMAP - Single source of truth!
 */

// Base entity
export { BaseEntity } from '@base/db/index';

// Core entities - re-export from centralized entityMap
export { loadEntities, getEntity, getEntities } from '@main/db/entityMap';