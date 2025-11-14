/**
 * LLMModelInputs - Custom inputs extending generated bases
 *
 * ✅ EDIT THIS FILE to add custom validation or computed fields
 * ⚠️  This file is created once and never overwritten
 *
 * Generated bases provide (from LLMModelInputsBase):
 * - CreateLLMModelInputBase - All entity fields for creation
 * - UpdateLLMModelInputBase - Required id + optional fields for updates
 * - CreateUpdateLLMModelInputBase - Optional id for upsert operations
 * - All bases extend BaseInput with validation helpers
 *
 * Add your custom fields or override validation below!
 */

import { InputType, Field } from 'type-graphql';
import {
  CreateLLMModelInputBase,
  UpdateLLMModelInputBase,
  CreateUpdateLLMModelInputBase
} from './__generated__/LLMModelInputsBase.js';

// ═════════════════════════════════════════════════════════════════════════════
// Create Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating LLMModel' })
export class CreateLLMModelInput extends CreateLLMModelInputBase {
  // ──────────────────────────────────────────────────────────────────────────
  // Custom Fields
  // ──────────────────────────────────────────────────────────────────────────

  // Example: Add a computed field
  // @Field(() => String, { nullable: true, description: 'Additional metadata' })
  // @IsOptional()
  // @IsString()
  // metadata?: string;

  // ──────────────────────────────────────────────────────────────────────────
  // Custom Validation
  // ──────────────────────────────────────────────────────────────────────────

  // Example: Override validate() to add custom business logic
  // async validate(): Promise<void> {
  //   await super.validate();
  //   if (this.someField && this.otherField) {
  //     throw new Error('someField and otherField cannot both be set');
  //   }
  // }
}

// ═════════════════════════════════════════════════════════════════════════════
// Update Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for updating LLMModel' })
export class UpdateLLMModelInput extends UpdateLLMModelInputBase {
  // Add custom fields or validation here
}

// ═════════════════════════════════════════════════════════════════════════════
// CreateUpdate Input (Upsert)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating or updating LLMModel' })
export class CreateUpdateLLMModelInput extends CreateUpdateLLMModelInputBase {
  // Add custom fields or validation here
}
