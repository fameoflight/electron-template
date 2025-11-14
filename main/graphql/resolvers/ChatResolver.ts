/**
 * ChatResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from ChatResolverBase):
 * - Queries: chat(id), chats(args), chatsArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput() (from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { ChatResolverBase } from './__generated__/ChatResolverBase.js';
import { Chat } from '@db/entities/Chat.js';
import { ChatStatus } from '@db/entities/__generated__/ChatBase.js';
import { MessageService } from '@main/services/MessageService.js';
import type { GraphQLContext } from '@shared/types';

@Resolver(() => Chat)
export class ChatResolver extends ChatResolverBase {
  // ──────────────────────────────────────────────────────────────────────────
  // Custom Queries
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get chats for the current user with filtering options
   */
  @Query(() => [Chat], { description: 'Get my chats' })
  async myChats(
    @Ctx() ctx: GraphQLContext,
    @Arg('status', () => String, { nullable: true }) status?: string
  ): Promise<Chat[]> {
    const messageService = new MessageService();
    const userId = messageService.validateAuth(ctx);
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    return await this.getRepository(ctx).find({
      where,
      order: { updatedAt: 'DESC' }
    });
  }

  /**
   * Get a single chat with all messages and versions
   */
  @Query(() => Chat, { description: 'Get chat with full conversation history' })
  async chatWithMessages(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<Chat> {
    const messageService = new MessageService();
    const userId = messageService.validateAuth(ctx);
    const chat = await this.getRepository(ctx).findOneOrFail({
      where: { id, userId }
    });

    // Load related messages with versions
    // This will be implemented in the service layer
    return chat;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Custom Mutations
  // ──────────────────────────────────────────────────────────────────────────


  /**
   * Archive a chat (soft delete)
   */
  @Mutation(() => Chat, { description: 'Archive chat' })
  async archiveChat(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<Chat> {
    const messageService = new MessageService();
    const userId = messageService.validateAuth(ctx);
    const chat = await this.getRepository(ctx).findOneOrFail({ where: { id, userId } });

    chat.status = ChatStatus.archived;
    await this.getRepository(ctx).save(chat);
    return chat;
  }
}
