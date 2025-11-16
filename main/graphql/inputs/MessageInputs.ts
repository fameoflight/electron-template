/**
 * MessageInputs - Custom inputs extending generated bases
 *
 * ✅ EDIT THIS FILE to add custom validation or computed fields
 * ⚠️  This file is created once and never overwritten
 *
 * Generated bases provide (from MessageInputsBase):
 * - CreateMessageInputBase - All entity fields for creation
 * - UpdateMessageInputBase - Required id + optional fields for updates
 * - CreateUpdateMessageInputBase - Optional id for upsert operations
 * - All bases extend BaseInput with validation helpers
 *
 * Add your custom fields or override validation below!
 */

import { InputType, Field } from 'type-graphql';
import { IsString, IsArray, IsOptional } from 'class-validator';
import {
  UpdateMessageInputBase,
  CreateUpdateMessageInputBase
} from './__generated__/MessageInputsBase.js';
import { BaseInput } from '@main/base/index.js';
import { FieldInput } from '@main/base/graphql/decorators/fields/FieldInput.js';

// ═════════════════════════════════════════════════════════════════════════════
// Send Message Input (Unified for new chats and replies)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Unified input for sending messages (creates new chat if chatId is not provided)' })
export class SendMessageInput extends BaseInput {
  static relationFields = ['chatId', 'llmModelId', 'attachmentIds'];
  // ──────────────────────────────────────────────────────────────────────────
  // Core Fields
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Parent chat ID (omit to create new chat)
   */
  @Field(() => String, {
    description: 'Parent chat ID (omit to create new chat)',
    nullable: true
  })
  @IsOptional()
  @IsString()
  chatId?: string;

  /**
   * User message content
   */
  @Field(() => String, { description: 'User message content' })
  @IsString()
  content!: string;

  /**
   * LLM model ID to use for this message
   */
  @Field(() => String, { description: 'LLM model ID to use for this message' })
  @IsString()
  llmModelId!: string;

  // ──────────────────────────────────────────────────────────────────────────
  // New Chat Fields (only used when chatId is not provided)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * System prompt override (only used when creating new chat)
   */
  @Field(() => String, {
    description: 'System prompt override (only used when creating new chat)',
    nullable: true
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  // ──────────────────────────────────────────────────────────────────────────
  // File Attachments
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * File attachment IDs to include with this message
   */
  @Field(() => [String], {
    nullable: true,
    description: 'File attachment IDs to include with this message'
  })
  @IsOptional()
  @IsArray()
  attachmentIds?: string[];

  // ──────────────────────────────────────────────────────────────────────────
  // Custom Validation
  // ──────────────────────────────────────────────────────────────────────────

  async validate(): Promise<void> {
    // IMPORTANT: Call super.validate() first to:
    // 1. Transform Relay global IDs to local database IDs
    // 2. Apply default values from decorators
    // 3. Run class-validator validation
    await super.validate();

    // Custom business logic validation
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('content is required and cannot be empty');
    }
    if (this.content.length > 50000) {
      throw new Error('content cannot exceed 50000 characters');
    }
    if (!this.llmModelId) {
      throw new Error('llmModelId is required');
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Update Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for updating Message' })
export class UpdateMessageInput extends UpdateMessageInputBase {
  // Add custom fields or validation here
}

// ═════════════════════════════════════════════════════════════════════════════
// CreateUpdate Input (Upsert)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for creating or updating Message' })
export class CreateUpdateMessageInput extends CreateUpdateMessageInputBase {
  // Add custom fields or validation here
}

// ═════════════════════════════════════════════════════════════════════════════
// Cancel Message Version Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for canceling a message version' })
export class CancelMessageVersionInput extends BaseInput {
  static relationFields = ['messageVersionId'];

  @FieldInput(String, { inputType: 'update', description: 'Input: Message version to cancel (ID of MessageVersion)', required: true })
  messageVersionId!: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// Regenerate Message Input
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Input for regenerating an assistant response from a specific message version' })
export class RegenerateMessageInput extends BaseInput {
  static relationFields = ['messageVersionId', 'llmModelId'];

  /**
   * The assistant message version ID to regenerate from (creates new version)
   */
  @Field(() => String, { description: 'Assistant message version ID to regenerate from' })
  @IsString()
  messageVersionId!: string;

  /**
   * LLM model ID to use for regeneration (optional, defaults to chat model)
   */
  @Field(() => String, {
    description: 'LLM model ID to use for regeneration (optional)',
    nullable: true
  })
  @IsOptional()
  @IsString()
  llmModelId?: string;

  async validate(): Promise<void> {
    await super.validate();

    if (!this.messageVersionId) {
      throw new Error('messageVersionId is required');
    }
  }
}
