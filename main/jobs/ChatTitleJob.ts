import { BaseJob } from '@main/base/jobs/BaseJob.js';
import { Job } from '@base/jobs/decorators/Job.js';
import { z } from 'zod';
import ChatService from '@main/services/ChatService.js';
import { TitleAgent } from '@main/ai/agents/title_agent.js';
import { MessageRole } from '@main/db/entities/__generated__/MessageBase.js';
import { Message } from '@main/db/entities/Message.js';
import { MessageVersion } from '@main/db/entities/MessageVersion.js';

/**
 * Chat title job schema with validation
 */
const ChatTitleSchema = z.object({
  /** ID of the chat to generate title for */
  chatId: z.string().uuid('Invalid chat ID'),
});

/**
 * Chat title job properties - the specific parameters for this job type
 * Note: userId and targetId are handled by the BaseJob API and not included here
 */
export interface ChatTitleJobProps {
  /** ID of the chat to generate title for */
  chatId: string;
}

/**
 * Result returned by ChatTitleJob
 */
export interface ChatTitleJobResult {
  /** Whether the job completed successfully */
  success: boolean;
  /** ID of the chat that was processed */
  chatId: string;
  /** Generated title */
  title?: string;
  /** Generated description */
  description?: string;
  /** Generated tags */
  tags?: string[];
  /** Error message if the job failed */
  error?: string;
}

@Job({
  name: 'ChatTitleJob',
  description: 'Generate titles, descriptions, and tags for chat conversations',
  schema: ChatTitleSchema,
  maxRetries: 2,
  backoff: 'exponential',
  baseDelay: 1000,
  maxDelay: 10000,
  timeoutMs: 60000,  // 1 minute timeout
  dedupeKey: (props) => `chat-title:${props.chatId}`,  // Prevent duplicate title generation for same chat
  retryIf: (error) => {
    // Retry on network or timeout errors, but not on validation errors
    return error instanceof Error &&
      !error.message.includes('validation') &&
      !error.message.includes('Invalid');
  }
})
export class ChatTitleJob extends BaseJob<ChatTitleJobProps> {

  private chatService: ChatService | null = null;

  /**
   * Generate title, description, and tags for a chat
   */
  async perform(props: ChatTitleJobProps, signal?: AbortSignal): Promise<ChatTitleJobResult> {
    this.log(`🚀 Starting ChatTitleJob for chat: ${props.chatId}`);

    this.chatService = new ChatService({ chatId: props.chatId });

    try {
      // Get the chat
      const chat = await this.chatService.getChat();
      this.log(`📋 Retrieved chat: ${chat.id}, title: "${chat.title}"`);

      // Check if title generation is needed
      if (!this.shouldGenerateTitle(chat)) {
        this.log(`⏭️ Chat ${chat.id} does not need title generation, skipping`);
        return {
          success: true,
          chatId: props.chatId,
          title: chat.title,
          description: chat.description,
          tags: chat.tags,
        };
      }

      // Get all user messages for conversation context
      const messages = await this.chatService.getMessages();
      const userMessages = messages.filter((msg: Message) => msg.role === MessageRole.user);

      if (userMessages.length === 0) {
        this.log(`⚠️ No user messages found in chat ${chat.id}, skipping title generation`);
        return {
          success: false,
          chatId: props.chatId,
          error: 'No user messages found to generate title from'
        };
      }

      this.log(`📝 Found ${userMessages.length} user messages for title generation`);

      // Build conversation content from user messages
      const conversationContent = this.buildConversationContent(userMessages);
      this.log(`📄 Built conversation content (${conversationContent.length} chars)`);

      // Create TitleAgent and generate title
      const modelConfig = chat.llmModel.getModelConfig();
      this.log(`🤖 Creating TitleAgent with model: ${modelConfig.modelIdentifier}`);

      const titleAgent = new TitleAgent(modelConfig);

      // Check if job was aborted before calling LLM
      if (signal?.aborted) {
        this.log(`⏹️ Job aborted before LLM call`);
        throw new Error('Job aborted');
      }

      this.log(`🎨 Generating title, description, and tags...`);
      const result = await titleAgent.generateTitle(conversationContent);

      // Update the chat with generated content
      this.log(`💾 Updating chat "${chat.id}" with generated title: "${result.title}"`);
      await this.chatService.updateEntity(chat, {
        title: result.title,
        description: result.description,
        tags: result.suggestedTags,
      });

      this.log(`✅ Successfully generated and saved title for chat ${chat.id}`);

      return {
        success: true,
        chatId: props.chatId,
        title: result.title,
        description: result.description,
        tags: result.suggestedTags,
      };

    } catch (error) {
      this.log('💥 ChatTitleJob failed:', error);

      // Handle abort/cancellation
      if (error instanceof Error && (error.name === 'AbortError' || signal?.aborted)) {
        this.log(`⏹️ Job was aborted`);
        return {
          success: false,
          chatId: props.chatId,
          error: 'Job was aborted'
        };
      }

      return {
        success: false,
        chatId: props.chatId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a chat needs title generation
   * Returns true if:
   * - Chat has at least 1 user message
   * - Title starts with "New Chat" (case insensitive)
   */
  private shouldGenerateTitle(chat: any): boolean {
    this.log(`🔍 Checking if title generation needed for chat: ${chat.id}`);
    this.log(`📋 Current title: "${chat.title}"`);

    const commonPatterns = [
      'hello chat',
      'untitled chat',
      'no title',
      'chat without title',
      'new conversation',
      'new chat'
    ]

    // Check if title starts with "New Chat" - but not "New Chatbot" or other variants
    const titleLower = chat.title.toLowerCase().trim();

    const shouldGenerate = commonPatterns.some(pattern => titleLower.startsWith(pattern)) || titleLower === '';
    this.log(`🎯 Title matches common pattern: ${shouldGenerate}`);

    return shouldGenerate;
  }

  /**
   * Build conversation content from user messages
   */
  private buildConversationContent(userMessages: Message[]): string {
    return userMessages.map((message: Message) => {
      // Get the current version content from each message
      const currentVersion = message.versions.find((v: MessageVersion) => v.id === message.currentVersionId) || message.versions[0];
      return currentVersion?.content || '';
    }).filter(content => content.trim() !== '').join('\n\n');
  }
}