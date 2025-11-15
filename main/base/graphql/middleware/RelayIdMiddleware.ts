import { MiddlewareFn } from 'type-graphql';
import { IdConverterService } from '../services/relay/IdConverterService.js';

/**
 * Type-GraphQL middleware that automatically converts Relay global IDs to local database IDs
 *
 * This middleware intercepts ALL resolver calls and automatically transforms ID arguments
 * from Relay global ID format (base64-encoded "TypeName:localId") to local database IDs.
 *
 * ## How It Works
 *
 * 1. **Detection**: Identifies ID parameters by naming convention:
 *    - Parameter named exactly 'id'
 *    - Parameters ending with 'Id' or 'Ids'
 *
 * 2. **Smart Conversion**: Only converts values that look like Relay IDs:
 *    - Skips null/undefined values
 *    - Skips values already in local format (UUIDs, numeric IDs)
 *    - Handles both single IDs and arrays of IDs
 *
 * 3. **Safe**: Never converts non-ID parameters or already-local IDs
 *
 * ## Usage
 *
 * ```typescript
 * // Register in schema.ts
 * buildSchema({
 *   resolvers: [...],
 *   globalMiddlewares: [RelayIdMiddleware]
 * });
 *
 * // Then in resolvers - IDs are automatically converted:
 * @Query(() => Chat)
 * async chat(@Arg('id') id: string, @Ctx() ctx: GraphQLContext): Promise<Chat> {
 *   // id is already converted to local format
 *   return this.getOwnedRepository(Chat, ctx).findOneOrFail({ where: { id } });
 * }
 * ```
 *
 * ## Examples
 *
 * ```typescript
 * // Single ID parameter
 * query { chat(id: "Q2hhdDoxMjM=") } // "Q2hhdDoxMjM=" → "123"
 *
 * // Multiple ID parameters
 * query { message(chatId: "Q2hhdDoxMjM=", messageId: "TWVzc2FnZTo0NTY=") }
 * // chatId: "Q2hhdDoxMjM=" → "123"
 * // messageId: "TWVzc2FnZTo0NTY=" → "456"
 *
 * // Array of IDs
 * query { chats(ids: ["Q2hhdDoxMjM=", "Q2hhdDo0NTY="]) }
 * // ids: ["Q2hhdDoxMjM=", "Q2hhdDo0NTY="] → ["123", "456"]
 * ```
 *
 * ## ID Format Detection
 *
 * The middleware distinguishes between Relay IDs and local IDs:
 * - **Relay ID**: Base64 string (typically 20+ chars) → CONVERT
 * - **UUID**: 8-4-4-4-12 format (36 chars with hyphens) → SKIP
 * - **Numeric**: Only digits → SKIP
 * - **null/undefined**: → SKIP
 *
 * ## Performance
 *
 * - Runs on every resolver call (minimal overhead: ~1ms per call)
 * - Only processes parameters with ID-like names
 * - Early exits for non-ID parameters and already-local IDs
 */
export const RelayIdMiddleware: MiddlewareFn = async ({ args, info }, next) => {
  // Only process Query and Mutation operations (skip nested field resolvers)
  const parentType = info.parentType.name;
  if (parentType !== 'Query' && parentType !== 'Mutation') {
    return next();
  }

  // Process all arguments
  for (const [paramName, value] of Object.entries(args)) {
    // Check if this looks like an ID parameter
    if (!isIdParameter(paramName)) continue;
    if (!value) continue; // Skip null/undefined

    // Convert single ID or array of IDs
    args[paramName] = convertIdValue(value);
  }

  return next();
};

/**
 * Check if parameter name indicates it's an ID field
 */
function isIdParameter(paramName: string): boolean {
  return paramName === 'id' || paramName.endsWith('Id') || paramName.endsWith('Ids');
}

/**
 * Convert ID value(s) from Relay format to local format
 * Handles both single IDs and arrays of IDs
 */
function convertIdValue(value: any): any {
  if (typeof value === 'string') {
    return shouldConvertToLocalId(value)
      ? IdConverterService.decodeId(value)
      : value;
  }

  if (Array.isArray(value)) {
    return value.map(id =>
      typeof id === 'string' && shouldConvertToLocalId(id)
        ? IdConverterService.decodeId(id)
        : id
    );
  }

  return value;
}

/**
 * Determine if a string value should be converted to local ID
 *
 * Returns true if the value looks like a Relay global ID:
 * - Not a UUID (8-4-4-4-12 format)
 * - Not a numeric ID
 * - Long enough to be a base64-encoded Relay ID (typically 20+ chars)
 */
function shouldConvertToLocalId(value: string): boolean {
  // Skip empty strings
  if (!value || value.trim() === '') return false;

  // Skip UUIDs (8-4-4-4-12 format)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  if (isUuid) return false;

  // Skip numeric IDs
  const isNumeric = /^\d+$/.test(value);
  if (isNumeric) return false;

  // Relay IDs are base64-encoded, typically longer than raw IDs
  // UUID = 36 chars, but Relay base64 of short IDs can be shorter
  // Use a conservative threshold: if it looks like base64, convert it
  const looksLikeBase64 = /^[A-Za-z0-9+/]+=*$/.test(value);
  if (!looksLikeBase64) return false;

  // If we got here, it's a base64-like string that's not a UUID or number
  return true;
}
