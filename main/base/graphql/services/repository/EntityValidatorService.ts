import { validate, ValidationError } from 'class-validator';

/**
 * Service for validating entities
 * Extracted from RelayRepository to follow Single Responsibility Principle
 */
export class EntityValidatorService {
  private static readonly SKIP_ERROR_MESSAGES = [
    'an unknown value was passed to the validate function'
  ];

  private static readonly OPTIONAL_INDICATORS = [
    'should not be null',
    'should not be undefined',
    'must be a number',
    'must be a positive number',
    'must not be greater than',
    'must not be less than'
  ];

  /**
   * Check if an error should be skipped
   */
  private static shouldSkipError(error: ValidationError): boolean {
    if (!error.constraints || Object.keys(error.constraints).length === 0) {
      return true;
    }

    const messages = Object.values(error.constraints || {});
    return messages.some(msg => this.SKIP_ERROR_MESSAGES.includes(msg));
  }

  /**
   * Check if an error is for an optional field with null/undefined value
   */
  private static isOptionalFieldError<T>(error: ValidationError, entity: T): boolean {
    if (!error.constraints || !error.property) {
      return false;
    }

    // Check if the failing property is null or undefined in the entity
    const propertyValue = (entity as Record<string, unknown>)[error.property];
    const isNullOrUndefined = propertyValue === null || propertyValue === undefined;

    if (!isNullOrUndefined) {
      return false;
    }

    // If the property is null/undefined, check if all constraints suggest it's optional
    const constraints = Object.values(error.constraints || {});
    return constraints.every(msg =>
      this.OPTIONAL_INDICATORS.some(indicator =>
        msg.toLowerCase().includes(indicator.toLowerCase())
      )
    );
  }

  /**
   * Filter validation errors to remove noise
   */
  private static filterValidationErrors<T>(errors: ValidationError[], entity: T): ValidationError[] {
    return errors
      .filter(error => !this.shouldSkipError(error))
      .filter(error => !this.isOptionalFieldError(error, entity));
  }

  /**
   * Format validation errors into a readable error message
   */
  private static formatValidationErrors(errors: ValidationError[]): string {
    const errorMessages = errors
      .map((error: ValidationError) => {
        const constraints = Object.values(error.constraints || {});
        return constraints.join(', ');
      })
      .filter(Boolean);

    return `Validation failed: ${errorMessages.join('; ')}`;
  }

  /**
   * Validate entity using class-validator
   * Only validates entities that have validation decorators
   * Skips validation for optional fields that are null or undefined
   *
   * @param entity Entity to validate
   * @throws Error with validation messages if validation fails
   */
  static async validateEntity<T extends object>(entity: T): Promise<void> {
    let validationErrors = await validate(entity, {
      whitelist: true, // Only validate decorated properties
      forbidNonWhitelisted: false, // Allow non-decorated properties
      stopAtFirstError: false, // Get all validation errors
    });

    // Filter out meaningless errors
    validationErrors = this.filterValidationErrors(validationErrors, entity);

    if (validationErrors.length > 0) {
      throw new Error(this.formatValidationErrors(validationErrors));
    }
  }

  /**
   * Validate entity with custom validation function
   * Runs both class-validator validation and custom validation
   *
   * @param entity Entity to validate
   * @param validationFn Custom validation function
   * @param validationErrorMsg Error message for custom validation failure
   * @throws Error if validation fails
   */
  static async validateWithCustom<T extends object>(
    entity: T,
    validationFn: () => Promise<boolean>,
    validationErrorMsg: string = 'Validation failed'
  ): Promise<void> {
    // Run class-validator validation
    await this.validateEntity(entity);

    // Run custom validation function (e.g., model verification)
    const isValid = await validationFn();
    if (!isValid) {
      throw new Error(validationErrorMsg);
    }
  }
}
