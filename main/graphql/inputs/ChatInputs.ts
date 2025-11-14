/**
 * ChatInputs - Custom inputs extending generated bases
 *
 * ✅ EDIT THIS FILE to add custom validation or computed fields
 * ⚠️  This file is created once and never overwritten
 *
 * Generated bases provide (from ChatInputsBase):
 * - CreateChatInputBase - All entity fields for creation
 * - UpdateChatInputBase - Required id + optional fields for updates
 * - CreateUpdateChatInputBase - Optional id for upsert operations
 * - All bases extend BaseInput with validation helpers
 *
 * Add your custom fields or override validation below!
 */

import { InputType, Field } from 'type-graphql';
import {
  CreateChatInputBase,
  UpdateChatInputBase,
  CreateUpdateChatInputBase
} from './__generated__/ChatInputsBase.js';

// ═════════════════════════════════════════════════════════════════════════════
// Create Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating Chat' })
export class CreateChatInput extends CreateChatInputBase {
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

@InputType({ description: 'Input for updating Chat' })
export class UpdateChatInput extends UpdateChatInputBase {
  // Add custom fields or validation here
}

// ═════════════════════════════════════════════════════════════════════════════
// CreateUpdate Input (Upsert)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating or updating Chat' })
export class CreateUpdateChatInput extends CreateUpdateChatInputBase {
  // Add custom fields or validation here
}
