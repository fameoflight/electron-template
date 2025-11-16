/**
 * MessageService - Common service for chat and message operations
 *
 * Extracts common patterns used across ChatResolver and MessageResolver:
 * - Authentication validation
 * - Message creation (user + assistant)
 * - StreamMessageJob enqueueing with error handling
 * - Consistent logging patterns
 */

import { DataSourceProvider } from '@base/db/index.js';
import { BaseService } from './BaseService.js';
import { Message } from '@db/entities/Message.js';
import { MessageVersion } from '@db/entities/MessageVersion.js';
import { FileEntity } from '@db/entities/FileEntity.js';
import { Chat } from '@db/entities/Chat.js';
import { MessageRole } from '@db/entities/__generated__/MessageBase.js';
import { MessageVersionStatus } from '@db/entities/__generated__/MessageVersionBase.js';
import { StreamMessageVersionJob } from '@main/jobs/StreamMessageVersionJob.js';
import type { GraphQLContext } from '@shared/types';
import { cancelJobs, getJobs } from '@main/db/utils/index.js';

export interface MessageCreationOptions {
  llmModelId?: string;
  /** Priority for the StreamMessageVersionJob (default: 80) */
  priority?: number;
  /** Timeout for the StreamMessageVersionJob in milliseconds (default: 120000) */
  timeoutMs?: number;
  /** File attachment IDs to include with this message */
  attachmentIds?: string[];
  /** Custom prefix for logging (default: 'MessageService') */
  logPrefix?: string;
}

export interface MessageCreationResult {
  /** Created user message */
  userMessage: Message;
  /** Created assistant message */
  assistantMessage: Message;
  /** Whether the streaming job was successfully enqueued */
  jobEnqueued: boolean;
  /** Error if job enqueueing failed */
  error?: Error;
}

export class MessageService extends BaseService {
  constructor() {
    super();
  }

  protected getServiceName(): string {
    return 'MessageService';
  }

  /**
   * Validate user authentication and return user ID
   * Throws error if not authenticated
   */
  validateAuth(ctx: GraphQLContext): string {
    if (!ctx.user?.id) {
      throw new Error('Authentication required');
    }
    return ctx.user.id;
  }

  async getChat(id: string): Promise<Chat | null> {
    const { chatRepository } = this.getRepositories();
    return await chatRepository.findOne({ where: { id } });
  }

  /**
   * Verify that user owns the chat and it has an LLM model configured
   */
  async validateChatForMessage(
    chatId: string,
    logPrefix: string = 'MessageService'
  ): Promise<Chat & { llmModel: any }> {
    const { chatRepository } = this.getRepositories();

    this.log(`Looking up chat ${chatId}`);

    const chat = await chatRepository.findOne({
      where: { id: chatId }, // Database enforces ownership constraint
      relations: ['llmModel']
    });

    if (!chat) {
      this.logError(`Chat not found or access denied: ${chatId}`);
      throw new Error(`Chat not found: ${chatId}`);
    }

    // Handle SmartLoadingSubscriber's Promise-based relations
    const llmModel = await chat.llmModel;
    if (!llmModel) {
      this.logError(`Chat ${chat.id} has no LLM model configured`);
      throw new Error('Chat has no LLM model configured');
    }

    this.log(`Found chat "${chat.title}" with LLM model: ${llmModel.name || 'None'}`);
    return { ...chat, llmModel } as Chat & { llmModel: any };
  }

  /**
   * Attach files to a message version with context using polymorphic relationship
   */
  async attachFilesToMessageVersion(
    chat: Chat,
    messageVersion: MessageVersion,
    attachmentIds: string[],
    userMessage: string
  ): Promise<void> {
    const dataSource = DataSourceProvider.get();

    // Get repositories with proper typing
    const fileRepo = dataSource.getRepository(FileEntity);

    this.log(`Processing ${attachmentIds.length} attachments for message version ${messageVersion.id}`);

    // Load the actual File entities
    const files = await fileRepo.findByIds(attachmentIds);

    if (files.length !== attachmentIds.length) {
      const foundIds = files.map(f => f.id);
      const missingIds = attachmentIds.filter(id => !foundIds.includes(id));
      throw new Error(`Files not found: ${missingIds.join(', ')}`);
    }

    // Update files to be owned by this message version using polymorphic relationship
    // Store the context in file metadata for later reference
    await Promise.all(files.map(async (file) => {
      const metadata = file.metadata || {};
      metadata.attachmentContext = userMessage.trim();
      metadata.chatId = chat.id;

      await fileRepo.update(file.id, {
        ownerId: messageVersion.id,
        ownerType: 'MessageVersion',
        metadata: metadata
      });
    }));

    this.log(`✓ Attached ${attachmentIds.length} files to message version ${messageVersion.id} using polymorphic relationship`);
  }

  /**
   * Create a user message with the specified content and optional attachments
   */
  async createUserMessage(
    chat: Chat,
    content: string,
    attachmentIds: string[] = [],
  ): Promise<Message> {
    const { messageRepository, messageVersionRepository } = this.getRepositories();


    if (!chat || !chat.llmModel) {
      throw new Error('Chat or LLM model not found for creating user message version');
    }

    const userId = chat.userId;

    // Step 1: Create MessageVersion first with completed status
    const messageVersion = await messageVersionRepository.save({
      content: content.trim(),
      isRegenerated: false,
      llmModelId: chat.llmModel.id, // Use chat's LLM model for consistency
      status: MessageVersionStatus.completed, // User messages start as completed
      userId
    });

    // Step 2: Create Message with the version reference
    const userMessage = await messageRepository.save({
      chatId: chat.id,
      role: MessageRole.user,
      content: content.trim(),
      currentVersionId: messageVersion.id,
      userId
    });

    // Step 3: Update MessageVersion with the messageId to establish the bidirectional relationship
    await messageVersionRepository.update(messageVersion.id, {
      messageId: userMessage.id
    });

    // Step 4: Handle file attachments if provided
    if (attachmentIds.length > 0) {
      this.log(`Attaching ${attachmentIds.length} files to message version: ${messageVersion.id}`);
      await this.attachFilesToMessageVersion(chat, messageVersion, attachmentIds, content);
    }

    this.log(`✓ Created user message: ${userMessage.id} (${content.length} chars) with version: ${messageVersion.id}`);
    return userMessage;
  }

  /**
   * Create an assistant message with pending status
   */
  async createAssistantMessage(
    chat: Chat,
    llmModelId: string,
    userId: string,
  ): Promise<Message> {
    const { messageRepository, messageVersionRepository } = this.getRepositories();

    this.log('Creating assistant message...');

    // Step 1: Create MessageVersion first with pending status
    const messageVersion = await messageVersionRepository.save({
      content: 'AI is thinking...', // Placeholder content
      isRegenerated: false,
      llmModelId: llmModelId,
      status: MessageVersionStatus.pending, // Will be updated by StreamMessageVersionJob
      userId
    });

    // Step 2: Create Message with the version reference
    const assistantMessage = await messageRepository.save({
      chatId: chat.id,
      role: MessageRole.assistant,
      content: 'AI is thinking...', // Placeholder content
      currentVersionId: messageVersion.id,
      llmModelId: llmModelId,
      userId
    });

    // Step 3: Update MessageVersion with the messageId to establish the bidirectional relationship
    await messageVersionRepository.update(messageVersion.id, {
      messageId: assistantMessage.id
    });

    this.log(`✓ Created assistant message: ${assistantMessage.id} with version: ${messageVersion.id}`);
    return assistantMessage;
  }

  /**
   * Enqueue StreamMessageVersionJob for an assistant message version
   */
  async enqueueStreamJob(
    assistantMessage: Message,
    userId: string,
    options: MessageCreationOptions = {},
    logPrefix: string = 'MessageService'
  ): Promise<boolean> {
    const { priority = 80, timeoutMs = 120000 } = options;

    this.log(`Enqueuing StreamMessageVersionJob for assistant message ${assistantMessage.id}...`);

    // Get the current message version for this assistant message
    const { messageVersionRepository } = this.getRepositories();
    const currentVersion = await messageVersionRepository.findOne({
      where: { id: assistantMessage.currentVersionId }
    });

    if (!currentVersion) {
      this.logError(`No current version found for assistant message: ${assistantMessage.id}`);
      return false;
    }

    // In test environment, we might want to skip actual job enqueueing
    // The test environment check allows tests to focus on message creation without requiring full job queue setup
    // TODO: remove this
    if (process.env.NODE_ENV === 'test') {
      this.log(`🧪 Test environment detected: Skipping actual StreamMessageVersionJob enqueueing`);

      // In test mode, we still simulate the job creation by creating a job record directly
      try {
        const { Job } = await import('@db/entities/Job.js');
        const dataSource = DataSourceProvider.get();
        const jobRepository = dataSource.getRepository(Job);

        // Create a mock job record for testing
        const { JobStatus } = await import('@db/entities/__generated__/JobBase.js');
        const mockJob = await jobRepository.save(
          jobRepository.create({
            type: 'StreamMessageVersionJob',
            userId,
            targetId: currentVersion.id,
            status: JobStatus.PENDING,
            priority,
            timeoutMS: timeoutMs,
            parameters: { messageVersionId: currentVersion.id }
          })
        );

        this.log(`✓ Created mock StreamMessageVersionJob record: ${mockJob.id} (${mockJob.id?.length > 0 ? 'success' : 'failed'})`);
        return true;
      } catch (mockError) {
        this.logError('Failed to create mock job record:', mockError);
        return false;
      }
    }

    try {
      const jobStartTime = Date.now();
      await StreamMessageVersionJob.performLater(
        userId,
        currentVersion.id, // targetId is now the message version ID
        { messageVersionId: currentVersion.id },
        {
          priority,
          timeoutMs
        }
      );
      const jobEnqueueTime = Date.now() - jobStartTime;
      this.log(`✓ Enqueued StreamMessageVersionJob for message version: ${currentVersion.id} (${jobEnqueueTime}ms)`);
      return true;
    } catch (error) {
      this.logError('✗ Failed to enqueue StreamMessageVersionJob:', error);
      return false;
    }
  }

  /**
   * Update assistant message version to failed state
   */
  async markAssistantMessageFailed(
    assistantMessage: Message,
    error: Error | string,
    logPrefix: string = 'MessageService'
  ): Promise<void> {
    const { messageVersionRepository } = this.getRepositories();
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.log(`Updating assistant message version ${assistantMessage.currentVersionId} to failed status`);

    await messageVersionRepository.update(assistantMessage.currentVersionId, {
      status: MessageVersionStatus.failed,
      content: 'Failed to start AI response. Please try again.'
    });

    // Note: Message doesn't have content property anymore - it's on the MessageVersion
    // The database update above handles the content update
  }

  /**
   * Complete flow: create user message, create assistant message, and start streaming
   *
   * This method encapsulates the common pattern used in both ChatResolver and MessageResolver
   */
  async createMessagePairAndStream(
    chatId: string,
    userMessageContent: string,
    options: MessageCreationOptions = {}
  ): Promise<MessageCreationResult> {
    const logPrefix = options.logPrefix || 'MessageService';
    const startTime = Date.now();

    try {
      // 1. Validate chat ownership and LLM model
      const chat = await this.validateChatForMessage(chatId);

      const userId = chat.userId;

      // 2. Create user message with attachments
      const userMessage = await this.createUserMessage(
        chat,
        userMessageContent,
        options.attachmentIds || [],
      );

      // prefer user provided LLM model if specified
      const llmModelId = options.llmModelId || chat.llmModel.id;

      // 3. Create assistant message
      const assistantMessage = await this.createAssistantMessage(chat, llmModelId, userId);

      this.log(`LLM Model: ${llmModelId}`);

      // 4. Enqueue StreamMessageJob
      const jobEnqueued = await this.enqueueStreamJob(assistantMessage, userId, options);

      // 5. Handle job enqueue failure
      if (!jobEnqueued) {
        await this.markAssistantMessageFailed(
          assistantMessage,
          new Error('Failed to enqueue StreamMessageJob'),
          logPrefix
        );
      }

      const totalTime = Date.now() - startTime;
      this.log(`✓ Completed in ${totalTime}ms, returning assistant message ${assistantMessage.id}`);

      return {
        userMessage,
        assistantMessage,
        jobEnqueued
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logError(`✗ Error after ${totalTime}ms:`, error);
      if (error instanceof Error) {
        this.logError(`Error stack: ${error.stack}`);
      }
      this.logError(`Input: chatId=${chatId}, contentLength=${userMessageContent.length}`);

      return {
        userMessage: null as any, // Won't be used when there's an error
        assistantMessage: null as any, // Won't be used when there's an error
        jobEnqueued: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Cancel a streaming message version by updating its status
   */
  async cancelStreamingMessage(
    messageVersionId: string,
    userId: string,
    logPrefix: string = 'MessageService'
  ): Promise<void> {
    this.log(`User ${userId} requesting cancellation of message version ${messageVersionId}`);

    let jobs = await getJobs(messageVersionId, ['StreamMessageVersionJob'], ['pending', 'in_progress']);

    jobs = await cancelJobs(jobs);

    this.log(`✓ Cancelled ${jobs.length} jobs for message version ${messageVersionId}`, jobs.map(j => `${j.id} ${j.status}`).join(', '));
  }

  /**
   * Regenerate an assistant message by creating a new version
   *
   * @param assistantMessageId The assistant message to regenerate
   * @param llmModelId The LLM model to use
   * @param userId The user ID
   * @param logPrefix Logging prefix
   * @returns The new message version and job status
   */
  async regenerateAssistantMessage(
    assistantMessageId: string,
    llmModelId: string,
    userId: string,
    logPrefix: string = 'MessageService'
  ): Promise<{
    newVersion: MessageVersion;
    jobEnqueued: boolean;
    error?: Error;
  }> {
    const { messageRepository, messageVersionRepository } = this.getRepositories();

    try {
      this.log(`${logPrefix}: Creating new version for assistant message ${assistantMessageId}`);

      // 1. Find the assistant message
      const assistantMessage = await messageRepository.findOne({
        where: { id: assistantMessageId },
        relations: ['versions']
      });

      if (!assistantMessage) {
        throw new Error(`Assistant message not found: ${assistantMessageId}`);
      }

      // 2. Create new message version with pending status
      const newVersion = await messageVersionRepository.save({
        content: 'AI is thinking...', // Placeholder content
        isRegenerated: true,
        llmModelId: llmModelId,
        status: MessageVersionStatus.pending,
        messageId: assistantMessage.id,
        userId
      });

      this.log(`${logPrefix}: ✓ Created new version ${newVersion.id}`);

      // 3. Update message's currentVersionId to point to the new version
      await messageRepository.update(assistantMessage.id, {
        currentVersionId: newVersion.id
      });

      this.log(`${logPrefix}: ✓ Updated message currentVersionId to ${newVersion.id}`);

      // 4. Enqueue streaming job
      const jobEnqueued = await StreamMessageVersionJob.performLater(
        userId,
        newVersion.id,
        { messageVersionId: newVersion.id },
        {
          priority: 80,
          timeoutMs: 120000
        }
      );

      if (!jobEnqueued) {
        this.logError(`${logPrefix}: Failed to enqueue StreamMessageVersionJob`);

        // Mark as failed
        await messageVersionRepository.update(newVersion.id, {
          status: MessageVersionStatus.failed,
          content: 'Failed to start regeneration'
        });

        return {
          newVersion,
          jobEnqueued: false,
          error: new Error('Failed to enqueue streaming job')
        };
      }

      this.log(`${logPrefix}: ✓ Enqueued StreamMessageVersionJob for version ${newVersion.id}`);

      return {
        newVersion,
        jobEnqueued: true
      };

    } catch (error) {
      this.logError(`${logPrefix}: Error regenerating message:`, error);
      return {
        newVersion: null as any,
        jobEnqueued: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}