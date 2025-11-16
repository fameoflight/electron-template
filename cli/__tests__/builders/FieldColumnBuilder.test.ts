/**
 * FieldColumnBuilder Tests
 *
 * Example tests demonstrating how to test the Fluent Builder pattern
 * Applied in Phase 5 of CLI refactoring
 */

import { describe, it, expect } from 'vitest';
import { FieldColumnBuilder } from '../../generators/builders/decorators/FieldColumnBuilder.js';

describe('FieldColumnBuilder', () => {
  describe('Factory Methods', () => {
    it('should create String builder', () => {
      const result = FieldColumnBuilder.String().build();
      expect(result).toBe('@FieldColumn(String)');
    });

    it('should create Number builder', () => {
      const result = FieldColumnBuilder.Number().build();
      expect(result).toBe('@FieldColumn(Number)');
    });

    it('should create Boolean builder', () => {
      const result = FieldColumnBuilder.Boolean().build();
      expect(result).toBe('@FieldColumn(Boolean)');
    });

    it('should create Date builder', () => {
      const result = FieldColumnBuilder.Date().build();
      expect(result).toBe('@FieldColumn(Date)');
    });
  });

  describe('Basic Options', () => {
    it('should add required option', () => {
      const result = FieldColumnBuilder.String()
        .required(true)
        .build();

      expect(result).toBe('@FieldColumn(String, { required: true })');
    });

    it('should add description option', () => {
      const result = FieldColumnBuilder.String()
        .description('User name')
        .build();

      expect(result).toBe("@FieldColumn(String, { description: 'User name' })");
    });

    it('should add unique constraint', () => {
      const result = FieldColumnBuilder.String()
        .unique(true)
        .build();

      expect(result).toBe('@FieldColumn(String, { unique: true })');
    });
  });

  describe('Validation Options', () => {
    it('should add maxLength for strings', () => {
      const result = FieldColumnBuilder.String()
        .maxLength(255)
        .build();

      expect(result).toBe('@FieldColumn(String, { maxLength: 255 })');
    });

    it('should add minLength for strings', () => {
      const result = FieldColumnBuilder.String()
        .minLength(1)
        .build();

      expect(result).toBe('@FieldColumn(String, { minLength: 1 })');
    });

    it('should add min value for numbers', () => {
      const result = FieldColumnBuilder.Number()
        .min(0)
        .build();

      expect(result).toBe('@FieldColumn(Number, { min: 0 })');
    });

    it('should add max value for numbers', () => {
      const result = FieldColumnBuilder.Number()
        .max(100)
        .build();

      expect(result).toBe('@FieldColumn(Number, { max: 100 })');
    });

    it('should add email validation', () => {
      const result = FieldColumnBuilder.String()
        .email(true)
        .build();

      expect(result).toBe('@FieldColumn(String, { email: true })');
    });

    it('should add UUID validation', () => {
      const result = FieldColumnBuilder.String()
        .isUUID(true)
        .build();

      expect(result).toBe('@FieldColumn(String, { isUUID: true })');
    });

    it('should add pattern validation', () => {
      const pattern = /^[A-Z]+$/;
      const result = FieldColumnBuilder.String()
        .pattern(pattern)
        .build();

      expect(result).toBe('@FieldColumn(String, { pattern: /^[A-Z]+$/ })');
    });
  });

  describe('Complex Options', () => {
    it('should add default value for string', () => {
      const result = FieldColumnBuilder.String()
        .defaultValue('pending')
        .build();

      expect(result).toBe("@FieldColumn(String, { defaultValue: 'pending' })");
    });

    it('should add default value for number', () => {
      const result = FieldColumnBuilder.Number()
        .defaultValue(0)
        .build();

      expect(result).toBe('@FieldColumn(Number, { defaultValue: 0 })');
    });

    it('should add default value for boolean', () => {
      const result = FieldColumnBuilder.Boolean()
        .defaultValue(false)
        .build();

      expect(result).toBe('@FieldColumn(Boolean, { defaultValue: false })');
    });

    it('should handle array fields', () => {
      const result = FieldColumnBuilder.String()
        .array(true)
        .build();

      expect(result).toBe('@FieldColumn(String, { array: true })');
    });

    it('should disable GraphQL generation', () => {
      const result = FieldColumnBuilder.String()
        .graphql(false)
        .build();

      expect(result).toBe('@FieldColumn(String, { graphql: false })');
    });
  });

  describe('Method Chaining', () => {
    it('should support fluent method chaining', () => {
      const result = FieldColumnBuilder.String()
        .description('User email address')
        .required(true)
        .email(true)
        .maxLength(255)
        .unique(true)
        .build();

      expect(result).toContain('@FieldColumn(String,');
      expect(result).toContain("description: 'User email address'");
      expect(result).toContain('required: true');
      expect(result).toContain('email: true');
      expect(result).toContain('maxLength: 255');
      expect(result).toContain('unique: true');
    });

    it('should build complex number field', () => {
      const result = FieldColumnBuilder.Number()
        .description('User age')
        .required(true)
        .min(0)
        .max(120)
        .defaultValue(18)
        .build();

      expect(result).toContain('@FieldColumn(Number,');
      expect(result).toContain("description: 'User age'");
      expect(result).toContain('required: true');
      expect(result).toContain('min: 0');
      expect(result).toContain('max: 120');
      expect(result).toContain('defaultValue: 18');
    });

    it('should build optional field', () => {
      const result = FieldColumnBuilder.String()
        .description('Optional notes')
        .maxLength(500)
        .build();

      expect(result).toContain('@FieldColumn(String,');
      expect(result).toContain("description: 'Optional notes'");
      expect(result).toContain('maxLength: 500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty builder', () => {
      const result = FieldColumnBuilder.String().build();
      expect(result).toBe('@FieldColumn(String)');
    });

    it('should handle special characters in description', () => {
      const result = FieldColumnBuilder.String()
        .description("User's name")
        .build();

      expect(result).toBe("@FieldColumn(String, { description: 'User\\'s name' })");
    });

    it('should handle special characters in default value', () => {
      const result = FieldColumnBuilder.String()
        .defaultValue("O'Reilly")
        .build();

      expect(result).toBe("@FieldColumn(String, { defaultValue: 'O\\'Reilly' })");
    });

    it('should handle zero as valid number', () => {
      const result = FieldColumnBuilder.Number()
        .min(0)
        .max(0)
        .defaultValue(0)
        .build();

      expect(result).toContain('min: 0');
      expect(result).toContain('max: 0');
      expect(result).toContain('defaultValue: 0');
    });
  });

  describe('Real-World Examples', () => {
    it('should generate email field decorator', () => {
      const result = FieldColumnBuilder.String()
        .description('User email address')
        .required(true)
        .email(true)
        .maxLength(255)
        .unique(true)
        .build();

      expect(result).toBe(
        "@FieldColumn(String, { required: true, description: 'User email address', unique: true, maxLength: 255, email: true })"
      );
    });

    it('should generate UUID field decorator', () => {
      const result = FieldColumnBuilder.String()
        .description('External system ID')
        .required(true)
        .isUUID(true)
        .build();

      expect(result).toBe(
        "@FieldColumn(String, { required: true, description: 'External system ID', isUUID: true })"
      );
    });

    it('should generate age field decorator', () => {
      const result = FieldColumnBuilder.Number()
        .description('User age')
        .required(false)
        .min(0)
        .max(120)
        .build();

      expect(result).toBe(
        "@FieldColumn(Number, { required: false, description: 'User age', min: 0, max: 120 })"
      );
    });

    it('should generate tags array field decorator', () => {
      const result = FieldColumnBuilder.String()
        .description('Post tags')
        .array(true)
        .required(false)
        .build();

      expect(result).toBe(
        "@FieldColumn(String, { required: false, description: 'Post tags', array: true })"
      );
    });
  });
});
