/**
 * MessageVersionInputs - Custom inputs extending generated bases
 *
 * ✅ EDIT THIS FILE to add custom validation or computed fields
 * ⚠️  This file is created once and never overwritten
 *
 * Generated bases provide (from MessageVersionInputsBase):
 * - CreateMessageVersionInputBase - All entity fields for creation
 * - UpdateMessageVersionInputBase - Required id + optional fields for updates
 * - CreateUpdateMessageVersionInputBase - Optional id for upsert operations
 * - All bases extend BaseInput with validation helpers
 *
 * Add your custom fields or override validation below!
 */

import { InputType, Field } from 'type-graphql';
import {
  CreateMessageVersionInputBase,
  UpdateMessageVersionInputBase,
  CreateUpdateMessageVersionInputBase
} from './__generated__/MessageVersionInputsBase.js';

// ═════════════════════════════════════════════════════════════════════════════
// Create Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating MessageVersion' })
export class CreateMessageVersionInput extends CreateMessageVersionInputBase {
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

@InputType({ description: 'Input for updating MessageVersion' })
export class UpdateMessageVersionInput extends UpdateMessageVersionInputBase {
  // Add custom fields or validation here
}

// ═════════════════════════════════════════════════════════════════════════════
// CreateUpdate Input (Upsert)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating or updating MessageVersion' })
export class CreateUpdateMessageVersionInput extends CreateUpdateMessageVersionInputBase {
  // Add custom fields or validation here
}
