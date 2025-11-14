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

// ═════════════════════════════════════════════════════════════════════════════
// Send Message Input (Unified for new chats and replies)
// ═════════════════════════════════════════════════════════════════════════════

@InputType({ description: 'Unified input for sending messages (creates new chat if chatId is not provided)' })
export class SendMessageInput {
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
   * Chat title (only used when creating new chat)
   */
  @Field(() => String, {
    description: 'Chat title (only used when creating new chat)',
    nullable: true
  })
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * System prompt override (only used when creating new chat)
   */
  @Field(() => String, {
    description: 'System prompt override (only used when creating new chat)',
    nullable: true
  })
  @IsString()
  systemPrompt!: string;

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
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('content is required and cannot be empty');
    }
    if (this.content.length > 50000) {
      throw new Error('content cannot exceed 50000 characters');
    }
    if (!this.llmModelId) {
      throw new Error('llmModelId is required');
    }

    // Validate new chat specific fields
    if (!this.chatId && !this.title) {
      throw new Error('title is required when creating a new chat');
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
