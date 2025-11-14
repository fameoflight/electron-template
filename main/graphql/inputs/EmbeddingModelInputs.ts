/**
 * EmbeddingModelInputs - Custom inputs extending generated bases
 *
 * ✅ EDIT THIS FILE to add custom validation or computed fields
 * ⚠️  This file is created once and never overwritten
 *
 * Generated bases provide (from EmbeddingModelInputsBase):
 * - CreateEmbeddingModelInputBase - All entity fields for creation
 * - UpdateEmbeddingModelInputBase - Required id + optional fields for updates
 * - CreateUpdateEmbeddingModelInputBase - Optional id for upsert operations
 * - All bases extend BaseInput with validation helpers
 *
 * Add your custom fields or override validation below!
 */

import { InputType, Field } from 'type-graphql';
import {
  CreateEmbeddingModelInputBase,
  UpdateEmbeddingModelInputBase,
  CreateUpdateEmbeddingModelInputBase
} from './__generated__/EmbeddingModelInputsBase.js';

// ═════════════════════════════════════════════════════════════════════════════
// Create Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating EmbeddingModel' })
export class CreateEmbeddingModelInput extends CreateEmbeddingModelInputBase {
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

@InputType({ description: 'Input for updating EmbeddingModel' })
export class UpdateEmbeddingModelInput extends UpdateEmbeddingModelInputBase {
  // Add custom fields or validation here
}

// ═════════════════════════════════════════════════════════════════════════════
// CreateUpdate Input (Upsert)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating or updating EmbeddingModel' })
export class CreateUpdateEmbeddingModelInput extends CreateUpdateEmbeddingModelInputBase {
  // Add custom fields or validation here
}
