/**
 * Chat - Custom entity extension
 *
 * This file extends the generated ChatBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/Chat.json
 */
import { Entity, Index, BeforeInsert, OneToMany, AfterInsert } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { ChatBase } from './__generated__/ChatBase.js';
import { Message } from '@main/db/entities/Message.js';

@Index("IDX_chat_llmModelId", ['llmModelId'])
@Index("IDX_chat_status", ['status'])
@Index("IDX_chat_updatedAt", ['updatedAt'])
@Index("IDX_chat_status_updatedAt", ['status', 'updatedAt'])
@ObjectType({ description: 'Chat conversation entity for managing AI conversations' })
@Entity('chats')
export class Chat extends ChatBase {
  // Add custom methods and computed fields here

  @OneToMany(() => Message, (message) => message.chat)
  messages!: Message[];
}
