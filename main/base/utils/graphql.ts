import { getMetadataStorage } from 'type-graphql';

/**
 * Helper function to collect all GraphQL fields for a class including inherited fields
 * Type-GraphQL stores field metadata with the class that originally defined the field,
 * so we need to traverse the prototype chain to get all fields.
 *
 * @param target - The class constructor to get fields for
 * @returns Array of field metadata including inherited fields
 *
 * @example
 * ```typescript
 * class MyEntity extends OwnedEntity {
 *   @FieldColumn(String) name!: string;
 * }
 *
 * const fields = getAllFieldsForClass(MyEntity);
 * // Returns fields from MyEntity + OwnedEntity + BaseEntity
 * ```
 */
export function getAllFieldsForClass(target: any) {
  const storage = getMetadataStorage();
  const allFields = new Map<string, any>();

  // Walk the prototype chain to collect fields from all parent classes
  let currentClass = target;
  const visitedClasses = new Set();

  while (currentClass && currentClass !== Function.prototype && !visitedClasses.has(currentClass)) {
    visitedClasses.add(currentClass);

    // Get fields defined directly on this class
    const fields = storage.fields.filter(
      (field: any) => field.target === currentClass
    );

    // Add fields to map (overwrites with more specific implementation if needed)
    fields.forEach((field: any) => {
      allFields.set(field.name, field);
    });

    // Move to prototype (parent class)
    currentClass = Object.getPrototypeOf(currentClass);
  }

  return Array.from(allFields.values());
}

/**
 * Helper function to get a specific field from a class including inherited fields
 *
 * @param target - The class constructor to search in
 * @param fieldName - The name of the field to find
 * @returns Field metadata or undefined if not found
 */
export function getFieldForClass(target: any, fieldName: string) {
  const allFields = getAllFieldsForClass(target);
  return allFields.find((field: any) => field.name === fieldName);
}