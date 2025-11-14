/**
 * Context for description generation
 */
export interface DescriptionContext {
  propertyName: string;
  fieldType?: any;
  target?: any;
  className?: string;
  fieldNameLower?: string;
  typeName?: string;
}

/**
 * Base interface for description generators using Chain of Responsibility pattern
 */
export interface DescriptionGenerator {
  /**
   * Try to generate a description, or return null to pass to next handler
   */
  generate(context: DescriptionContext): string | null;

  /**
   * Set the next generator in the chain
   */
  setNext(generator: DescriptionGenerator): DescriptionGenerator;
}

/**
 * Abstract base class for description generators
 */
abstract class BaseDescriptionGenerator implements DescriptionGenerator {
  protected next: DescriptionGenerator | null = null;

  setNext(generator: DescriptionGenerator): DescriptionGenerator {
    this.next = generator;
    return generator;
  }

  /**
   * Template method: try to generate, or delegate to next
   */
  generate(context: DescriptionContext): string | null {
    const result = this.tryGenerate(context);
    if (result !== null) {
      return result;
    }

    if (this.next) {
      return this.next.generate(context);
    }

    return null;
  }

  /**
   * Implement this in subclasses to try generating a description
   */
  protected abstract tryGenerate(context: DescriptionContext): string | null;

  /**
   * Helper to capitalize first letter
   */
  protected capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ============================================================================
// Field Description Generators (for @FieldColumn)
// ============================================================================

/**
 * Generator for class-specific field patterns (e.g., User.name, Post.title)
 */
class ClassContextFieldGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    if (!context.className) return null;

    const { className, fieldNameLower } = context;

    // User-specific fields
    if (className === 'user') {
      if (fieldNameLower === 'name') return 'User full name';
      if (fieldNameLower === 'username') return 'Unique username for login';
      if (fieldNameLower === 'email') return 'User email address';
      if (fieldNameLower === 'password') return 'User password (hashed)';
    }

    // Post-specific fields
    if (className === 'post') {
      if (fieldNameLower === 'title') return 'Post title';
      if (fieldNameLower === 'content') return 'Post content/body';
      if (fieldNameLower === 'excerpt') return 'Post excerpt or summary';
    }

    return null;
  }
}

/**
 * Generator for common field name patterns
 */
class CommonFieldPatternGenerator extends BaseDescriptionGenerator {
  private patterns: Record<string, string> = {
    'email': 'Email address',
    'name': 'Name field',
    'title': 'Title',
    'phone': 'Phone number',
    'mobile': 'Phone number',
    'address': 'Address',
    'city': 'City name',
    'country': 'Country name',
    'zip': 'Postal/ZIP code',
    'postal': 'Postal/ZIP code',
  };

  protected tryGenerate(context: DescriptionContext): string | null {
    const { fieldNameLower = '' } = context;

    for (const [pattern, description] of Object.entries(this.patterns)) {
      if (fieldNameLower.includes(pattern)) {
        return description;
      }
    }

    // Content/body patterns
    if (fieldNameLower.includes('content') || fieldNameLower.includes('body')) {
      return 'Content';
    }

    // Description patterns
    if (fieldNameLower.includes('description') || fieldNameLower.includes('desc')) {
      return 'Description';
    }

    // URL patterns
    if (fieldNameLower.includes('url') || fieldNameLower.includes('website') || fieldNameLower.includes('link')) {
      return 'URL or website link';
    }

    // Image patterns
    if (fieldNameLower.includes('image') || fieldNameLower.includes('avatar') || fieldNameLower.includes('photo')) {
      return 'Image URL or path';
    }

    return null;
  }
}

/**
 * Generator for type-based descriptions
 */
class TypeBasedFieldGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    const { fieldType, fieldNameLower = '' } = context;
    const typeName = typeof fieldType === 'function' ? fieldType.name?.toLowerCase() : '';

    if (typeName === 'date') {
      if (fieldNameLower.includes('created')) return 'Creation timestamp';
      if (fieldNameLower.includes('updated') || fieldNameLower.includes('modified')) {
        return 'Last update timestamp';
      }
      if (fieldNameLower.includes('deleted')) return 'Deletion timestamp';
      return 'Date field';
    }

    if (typeName === 'boolean') {
      if (fieldNameLower.includes('active') || fieldNameLower.includes('enabled')) {
        return 'Whether the record is active';
      }
      if (fieldNameLower.includes('published') || fieldNameLower.includes('visible')) {
        return 'Whether the content is published';
      }
      if (fieldNameLower.includes('deleted')) return 'Whether the record is deleted';
      return 'Boolean flag';
    }

    return null;
  }
}

/**
 * Generator for generic field patterns
 */
class GenericFieldPatternGenerator extends BaseDescriptionGenerator {
  private patterns: Record<string, string> = {
    'id': 'Identifier field',
    'count': 'Count or total',
    'total': 'Count or total',
    'status': 'Status field',
    'type': 'Type classification',
    'level': 'Level or rank',
    'priority': 'Priority level',
    'order': 'Order or sort field',
    'sort': 'Order or sort field',
  };

  protected tryGenerate(context: DescriptionContext): string | null {
    const { fieldNameLower = '' } = context;

    for (const [pattern, description] of Object.entries(this.patterns)) {
      if (fieldNameLower.includes(pattern)) {
        return description;
      }
    }

    return null;
  }
}

/**
 * Fallback generator: capitalize property name
 */
class FallbackFieldGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    return this.capitalize(context.propertyName);
  }
}

// ============================================================================
// Enum Description Generators
// ============================================================================

/**
 * Generator for class-specific enum patterns
 */
class ClassContextEnumGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    const { className, fieldNameLower = '', propertyName } = context;
    const enumName = propertyName;

    if (!className) return null;

    const name = enumName.toLowerCase();

    if (name.includes(className.toLowerCase())) {
      if (name.includes('status')) return `${className} status options`;
      if (name.includes('type')) return `${className} type options`;
      if (name.includes('role')) return `${className} role options`;
      if (name.includes('level')) return `${className} level options`;
      if (name.includes('priority')) return `${className} priority options`;
    }

    return null;
  }
}

/**
 * Generator for common enum patterns
 */
class CommonEnumPatternGenerator extends BaseDescriptionGenerator {
  private patterns: Record<string, string> = {
    'status': 'status options',
    'type': 'type options',
    'role': 'role options',
    'level': 'level options',
    'priority': 'priority options',
    'category': 'category options',
    'state': 'state options',
    'mode': 'mode options',
  };

  protected tryGenerate(context: DescriptionContext): string | null {
    const name = context.propertyName.toLowerCase();

    for (const [pattern, suffix] of Object.entries(this.patterns)) {
      if (name.includes(pattern)) {
        return `${context.propertyName} ${suffix}`;
      }
    }

    return null;
  }
}

/**
 * Fallback enum generator
 */
class FallbackEnumGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    return `${context.propertyName} enum type`;
  }
}

// ============================================================================
// Computed Field Description Generators
// ============================================================================

/**
 * Generator for computed field patterns
 */
class ComputedFieldPatternGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    const { propertyName, className = 'Entity', fieldNameLower = '' } = context;
    const formattedPropertyName = this.capitalize(propertyName);

    // Full name patterns
    if (fieldNameLower === 'fullname' || fieldNameLower === 'displayname') {
      return `${className} full name`;
    }

    // Count patterns
    if (fieldNameLower.endsWith('count')) {
      const entityName = propertyName.replace(/count$/i, '');
      return `Number of ${entityName}`;
    }

    // Is/Has boolean patterns
    if (fieldNameLower.startsWith('is') || fieldNameLower.startsWith('has')) {
      return formattedPropertyName.replace(/([A-Z])/g, ' $1').trim();
    }

    // Get patterns
    if (fieldNameLower.startsWith('get')) {
      return formattedPropertyName.replace(/^Get/, '').replace(/([A-Z])/g, ' $1').trim();
    }

    // Calculate patterns
    if (fieldNameLower.startsWith('calculate')) {
      return formattedPropertyName.replace(/^Calculate/, '').replace(/([A-Z])/g, ' $1').trim();
    }

    // Formatted patterns
    if (fieldNameLower.includes('formatted')) {
      return `Formatted ${propertyName.replace(/formatted/i, '')}`;
    }

    return null;
  }
}

/**
 * Fallback computed field generator
 */
class FallbackComputedFieldGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    return this.capitalize(context.propertyName);
  }
}

// ============================================================================
// Relationship Description Generators
// ============================================================================

/**
 * Generator for relationship descriptions
 */
class RelationshipDescriptionGenerator extends BaseDescriptionGenerator {
  protected tryGenerate(context: DescriptionContext): string | null {
    const { className = 'Entity', propertyName, typeName } = context;
    const formattedPropertyName = this.capitalize(propertyName);

    if (!typeName) return null;

    switch (typeName) {
      case 'many-to-one':
        return `${className} ${propertyName}`;
      case 'one-to-many':
        return `${formattedPropertyName} associated with this ${className.toLowerCase()}`;
      case 'one-to-one':
        return `${className} ${propertyName}`;
      case 'many-to-many':
        return `${formattedPropertyName} associated with this ${className.toLowerCase()}`;
      default:
        return formattedPropertyName;
    }
  }
}

// ============================================================================
// Factory for building description generator chains
// ============================================================================

export class DescriptionGeneratorFactory {
  /**
   * Create a chain for field descriptions
   */
  static createFieldDescriptionChain(): DescriptionGenerator {
    const chain = new ClassContextFieldGenerator();
    chain
      .setNext(new CommonFieldPatternGenerator())
      .setNext(new TypeBasedFieldGenerator())
      .setNext(new GenericFieldPatternGenerator())
      .setNext(new FallbackFieldGenerator());

    return chain;
  }

  /**
   * Create a chain for enum descriptions
   */
  static createEnumDescriptionChain(): DescriptionGenerator {
    const chain = new ClassContextEnumGenerator();
    chain
      .setNext(new CommonEnumPatternGenerator())
      .setNext(new FallbackEnumGenerator());

    return chain;
  }

  /**
   * Create a chain for computed field descriptions
   */
  static createComputedFieldDescriptionChain(): DescriptionGenerator {
    const chain = new ComputedFieldPatternGenerator();
    chain.setNext(new FallbackComputedFieldGenerator());

    return chain;
  }

  /**
   * Create a chain for relationship descriptions
   */
  static createRelationshipDescriptionChain(): DescriptionGenerator {
    const chain = new RelationshipDescriptionGenerator();
    chain.setNext(new FallbackFieldGenerator());

    return chain;
  }

  /**
   * Helper to prepare context from common inputs
   */
  static createContext(
    propertyName: string,
    fieldType?: any,
    target?: any,
    relationshipType?: string
  ): DescriptionContext {
    const className = target?.constructor?.name?.replace(/Entity|Model|Type$/, '')?.toLowerCase();

    return {
      propertyName,
      fieldType,
      target,
      className,
      fieldNameLower: propertyName.toLowerCase(),
      typeName: relationshipType
    };
  }
}
