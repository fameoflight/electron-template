/**
 * MessageResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from MessageResolverBase):
 * - Queries: message(id), messages(args), messagesArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput()(from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Resolver, Query, Arg, Ctx, FieldResolver, Root } from 'type-graphql';
import { MessageResolverBase } from './__generated__/MessageResolverBase.js';
import { Message } from '@db/entities/Message.js';
import { MessageVersion } from '@db/entities/MessageVersion.js';
import { Chat } from '@db/entities/Chat.js';
import { DataSourceProvider } from '@base/db/index.js';
import { SendMessageInput, CancelMessageVersionInput, RegenerateMessageInput } from '@main/graphql/inputs/MessageInputs.js';
import { MessageService } from '@main/services/MessageService.js';
import type { GraphQLContext } from '@shared/types';
import { ChatStatus } from '@main/db/entities/__generated__/ChatBase.js';
import { ChatTitleJob } from '@main/jobs/ChatTitleJob.js';
import { getRepo } from '@main/db/utils/index.js';
import { FieldMutation } from '@base/index.js';

@Resolver(() => Message)
export class MessageResolver extends MessageResolverBase {
  // ──────────────────────────────────────────────────────────────────────────
  // Custom Queries
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get messages for a specific chat
   */
  @Query(() => [Message], { description: 'Get messages for chat' })
  async chatMessages(
    @Arg('chatId', () => String) chatId: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<Message[]> {
    const logPrefix = 'MessageResolver';

    try {
      // Verify user owns the chat (would be implemented with proper service)
      const messages = await this.getRepository(ctx).find({
        where: { chat: { id: chatId } },
        order: { createdAt: 'ASC' },
        relations: ['versions'] // Load the versions relationship
      });

      return messages;
    } catch (error) {
      const messageService = new MessageService();
      messageService.logError(`Error fetching messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Custom Mutations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Unified mutation for sending messages (creates new chat if chatId is not provided)
   *
   * This mutation:
   * 1. If chatId is provided: adds message to existing chat
   * 2. If chatId is not provided: creates new chat first, then adds message
   * 3. Validates that model supports vision if image attachments are provided
   * 4. Creates user message + assistant message pair
   * 5. Enqueues StreamMessageVersionJob to start streaming AI response
   * 6. Returns the assistant message for potential cancellation
   */
  @FieldMutation(SendMessageInput, Message, {
    description: 'Send message (creates new chat if chatId is not provided)'
  })
  async sendMessage(
    input: SendMessageInput,
    ctx: GraphQLContext
  ): Promise<Message> {
    const messageService = new MessageService();
    const userId = messageService.validateAuth(ctx);
    const logPrefix = 'MessageResolver';

    messageService.log(`sendMessage: chatId=${input.chatId}, content="${input.content.substring(0, 50)}..."`);

    // 1. Validate LLM model ownership
    const { LLMModel } = await import('@db/entities/LLMModel.js');
    const dataSource = DataSourceProvider.get();
    const llmModelRepository = dataSource.getRepository(LLMModel);

    const llmModel = await llmModelRepository.findOne({
      where: { id: input.llmModelId, userId }
    });

    if (!llmModel) {
      throw new Error(`LLM model not found: ${input.llmModelId}`);
    }

    // 2. Validate vision capability if attachments are provided
    if (input.attachmentIds && input.attachmentIds.length > 0) {
      const hasVisionCapability = llmModel.capabilities.includes('VISION' as any);
      if (!hasVisionCapability) {
        throw new Error(`Model ${llmModel.name} does not support vision. Cannot process image attachments.`);
      }
      messageService.log(`✓ Model ${llmModel.name} supports vision, validating ${input.attachmentIds.length} attachments`);
    }

    let chatId: string;

    // 3. Create new chat if chatId is not provided
    if (!input.chatId) {
      messageService.log(`Creating new chat with model ${llmModel.name} (${llmModel.id})`);

      const chatRepository = dataSource.getRepository(Chat);

      const newChat = chatRepository.create({
        title: 'Untitled Chat',
        status: ChatStatus.active,
        systemPrompt: input.systemPrompt,
        llmModelId: input.llmModelId,
        userId
      });

      const savedChat = await chatRepository.save(newChat);
      chatId = Array.isArray(savedChat) ? savedChat[0].id : savedChat.id;

      messageService.log(`✓ Created new chat: ${chatId}`);
    } else {
      chatId = input.chatId;
      messageService.log(`Using existing chat: ${chatId}`);
    }

    // 4. Create message pair and start streaming
    const result = await messageService.createMessagePairAndStream(
      chatId,
      input.content,
      {
        llmModelId: input.llmModelId,
        attachmentIds: input.attachmentIds,
        priority: 80, // High priority for interactive chat
        timeoutMs: 120000, // 2 minutes
        logPrefix
      }
    );

    if (!input.chatId) {
      await ChatTitleJob.performLater(
        userId,
        chatId,
        { chatId: chatId },
        {
          priority: 80,
          timeoutMs: 120000
        }
      );
    } else {
      console.log(`${logPrefix}: Skipping ChatTitleJob enqueueing for existing chat ${chatId}`);
    }

    if (result.error) {
      throw result.error;
    }

    messageService.log(`✓ Message sent successfully, assistant message: ${result.assistantMessage.id}`);
    return result.assistantMessage;
  }


  /**
   * Cancel a streaming message version
   *
   * Updates message version status to 'cancelled' which the StreamMessageVersionJob
   * will detect and stop streaming, preserving partial content.
   */
  @FieldMutation(CancelMessageVersionInput, MessageVersion, {
    description: 'Cancel a streaming message version',
    nullable: true
  })
  async cancelMessageVersion(
    input: CancelMessageVersionInput,
    ctx: GraphQLContext
  ): Promise<MessageVersion | null> {
    const messageService = new MessageService();
    const userId = messageService.validateAuth(ctx);
    const logPrefix = 'MessageResolver';

    await messageService.cancelStreamingMessage(input.messageVersionId!, userId, logPrefix);

    const messageVersionRepo = getRepo(MessageVersion);
    return await messageVersionRepo.findOne({
      where: { id: input.messageVersionId },
      relations: ['message']
    });
  }

  /**
   * Regenerate an assistant message from a specific version
   *
   * This mutation:
   * 1. Finds the assistant message version by ID
   * 2. Validates user owns the chat
   * 3. Creates a new assistant message version
   * 4. Enqueues StreamMessageVersionJob to start streaming
   * 5. Returns the updated assistant message with new version
   */
  @FieldMutation(RegenerateMessageInput, Message, {
    description: 'Regenerate assistant response from a specific version (creates new version)'
  })
  async regenerateMessage(
    input: RegenerateMessageInput,
    ctx: GraphQLContext
  ): Promise<Message> {
    const messageService = new MessageService();
    const userId = messageService.validateAuth(ctx);
    const logPrefix = 'MessageResolver.regenerateMessage';

    messageService.log(`${logPrefix}: Regenerating from message version ${input.messageVersionId}`);

    const dataSource = DataSourceProvider.get();
    const messageVersionRepo = getRepo(MessageVersion);
    const messageRepo = getRepo(Message);
    const { LLMModel } = await import('@db/entities/LLMModel.js');

    // 1. Find the assistant message version
    const messageVersion = await messageVersionRepo.findOne({
      where: { id: input.messageVersionId },
      relations: ['message']
    });

    if (!messageVersion) {
      throw new Error(`Message version not found: ${input.messageVersionId}`);
    }

    // 2. Load the message
    const message = await messageVersion.message;
    if (!message) {
      throw new Error('Message not found for this version');
    }

    if (message.role !== 'assistant') {
      throw new Error('Can only regenerate assistant messages');
    }

    // 3. Load the full message with chat
    const assistantMessage = await messageRepo.findOne({
      where: { id: message.id },
      relations: ['chat', 'versions']
    });

    if (!assistantMessage) {
      throw new Error(`Assistant message not found: ${message.id}`);
    }

    // 4. Load chat and validate ownership
    const chat = await assistantMessage.chat;
    if (!chat) {
      throw new Error('Chat not found for message');
    }

    if (chat.userId !== userId) {
      throw new Error('Unauthorized: You do not own this chat');
    }

    // 5. Determine LLM model to use (from input, version, or chat)
    const llmModelId = input.llmModelId || chat.llmModelId;

    if (!llmModelId) {
      throw new Error('No LLM model specified');
    }

    // Validate model ownership
    const llmModelRepo = dataSource.getRepository(LLMModel);
    const llmModel = await llmModelRepo.findOne({
      where: { id: llmModelId, userId }
    });

    if (!llmModel) {
      throw new Error(`LLM model not found: ${llmModelId}`);
    }

    messageService.log(`${logPrefix}: Using model ${llmModel.name} (${llmModel.id})`);

    // 6. Create new assistant message version and start streaming
    const result = await messageService.regenerateAssistantMessage(
      assistantMessage.id,
      llmModelId,
      userId,
      logPrefix
    );

    if (result.error) {
      throw result.error;
    }

    messageService.log(`${logPrefix}: ✓ Regeneration started, new version: ${result.newVersion.id}`);

    // 7. Return updated message
    const updatedMessage = await messageRepo.findOne({
      where: { id: assistantMessage.id },
      relations: ['versions', 'chat']
    });

    return updatedMessage!;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Field Resolvers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Resolve the chat relationship for messages
   */
  @FieldResolver(() => Chat, { nullable: true })
  async chat(@Root() message: Message): Promise<Chat | null> {
    const dataSource = DataSourceProvider.get();
    const chatRepository = dataSource.getRepository(Chat);

    const chatRecord = await message.chat;
    return await chatRepository.findOne({
      where: { id: chatRecord?.id || (message as any).chatId }
    });
  }

  /**
   * Resolve the current version relationship for messages
   */
  @FieldResolver(() => MessageVersion, { nullable: true })
  async currentVersion(@Root() message: Message): Promise<MessageVersion | null> {
    const dataSource = DataSourceProvider.get();
    const messageVersionRepository = dataSource.getRepository(MessageVersion);

    return await messageVersionRepository.findOne({
      where: { id: message.currentVersionId }
    });
  }
}
