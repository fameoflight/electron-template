/**
 * FileEntityInputs - Custom inputs extending generated bases
 *
 * ✅ EDIT THIS FILE to add custom validation or computed fields
 * ⚠️  This file is created once and never overwritten
 *
 * Generated bases provide (from FileEntityInputsBase):
 * - CreateFileEntityInputBase - All entity fields for creation
 * - UpdateFileEntityInputBase - Required id + optional fields for updates
 * - CreateUpdateFileEntityInputBase - Optional id for upsert operations
 * - All bases extend BaseInput with validation helpers
 *
 * Add your custom fields or override validation below!
 */

import { InputType, Field } from 'type-graphql';
import {
  CreateFileEntityInputBase,
  UpdateFileEntityInputBase,
  CreateUpdateFileEntityInputBase
} from './__generated__/FileEntityInputsBase.js';

// ═════════════════════════════════════════════════════════════════════════════
// Create Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating FileEntity' })
export class CreateFileEntityInput extends CreateFileEntityInputBase {
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

@InputType({ description: 'Input for updating FileEntity' })
export class UpdateFileEntityInput extends UpdateFileEntityInputBase {
  // Add custom fields or validation here
}

// ═════════════════════════════════════════════════════════════════════════════
// CreateUpdate Input (Upsert)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating or updating FileEntity' })
export class CreateUpdateFileEntityInput extends CreateUpdateFileEntityInputBase {
  // Add custom fields or validation here
}
