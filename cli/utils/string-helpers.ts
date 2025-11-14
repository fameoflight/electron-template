/**
 * String manipulation utilities for generators
 * Provides Rails-like inflections and case conversions
 */

// Import inflection functions from shared utils
import { pluralize, singularize } from '../../shared/utils.js';
export { pluralize, singularize } from '../../shared/utils.js';

/**
 * Convert string to PascalCase
 * Examples: "user_profile" -> "UserProfile", "user-profile" -> "UserProfile"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, (char) => char.toUpperCase());
}

/**
 * Convert string to camelCase
 * Examples: "UserProfile" -> "userProfile", "user-profile" -> "userProfile"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to kebab-case
 * Examples: "UserProfile" -> "user-profile", "user_profile" -> "user-profile"
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to snake_case
 * Examples: "UserProfile" -> "user_profile", "user-profile" -> "user_profile"
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}


/**
 * Check if a string is already plural
 */
export function isPlural(str: string): boolean {
  return pluralize(singularize(str)) === str;
}

/**
 * Check if a string is already singular
 */
export function isSingular(str: string): boolean {
  return singularize(pluralize(str)) === str;
}

/**
 * Generate migration timestamp in format YYYYMMDDHHMMSS
 */
export function generateMigrationTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate migration filename with timestamp
 * Example: AddPostFTS_20251105142918
 */
export function generateMigrationName(prefix: string): string {
  const timestamp = generateMigrationTimestamp();
  return `${prefix}_${timestamp}`;
}
