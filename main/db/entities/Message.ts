/**
 * Message - Custom entity extension
 *
 * This file extends the generated MessageBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/Message.json
 */
import { Entity, Index, BeforeInsert, OneToMany } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { MessageBase } from './__generated__/MessageBase.js';
import { MessageVersion } from './MessageVersion.js';

@Index("IDX_message_chatId", ['chatId'])
@Index("IDX_message_createdAt", ['createdAt'])
@Index("IDX_message_chatId_createdAt", ['chatId', 'createdAt'])
@ObjectType({ description: 'Message entity for individual chat messages with versioning support' })
@Entity('messages')
export class Message extends MessageBase {
  // Add custom methods and computed fields here

  @Field(() => [MessageVersion], { description: 'List of message versions', nullable: false })
  @OneToMany(() => MessageVersion, (messageVersion) => messageVersion.message)
  versions!: MessageVersion[];


  /**
   * Check if this message is from the user
   */
  get isUserMessage(): boolean {
    return this.role === 'user';
  }

  /**
   * Check if this message is from the assistant
   */
  get isAssistantMessage(): boolean {
    return this.role === 'assistant';
  }

  /**
   * Check if this message is a system message
   */
  get isSystemMessage(): boolean {
    return this.role === 'system';
  }

  /**
   * Get display text for the role
   */
  get displayRole(): string {
    switch (this.role) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'Assistant';
      case 'system':
        return 'System';
      default:
        return this.role;
    }
  }

  // Example: Lifecycle hook
  // @BeforeInsert()
  // doSomethingBeforeInsert() {
  //   // Custom logic
  // }
}
