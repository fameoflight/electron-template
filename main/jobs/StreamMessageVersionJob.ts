import { BaseJob } from '@main/base/jobs/BaseJob.js';
import { Job } from '@base/jobs/decorators/Job.js';
import { z } from 'zod';
import { streamText } from 'ai';
import { MessageVersion } from '@main/db/entities/MessageVersion.js';
import { MessageVersionStatus } from '@db/entities/__generated__/MessageVersionBase.js';
import ChatService from '@main/services/ChatService';
import { getOrCreateProviderMinimal } from '@main/ai/providerFactory';
import { optimizeAfterStreaming } from '@main/db/utils/index.js';


/**
 * Stream message version job schema with validation
 */
const StreamMessageVersionSchema = z.object({
  /** ID of the message version to update with streaming content */
  messageVersionId: z.string().uuid('Invalid message version ID'),
});

/**
 * Stream message version job properties - the specific parameters for this job type
 * Note: userId and targetId are handled by the BaseJob API and not included here
 */
export interface StreamMessageVersionJobProps {
  /** ID of the message version to update with streaming content */
  messageVersionId: string;
}

/**
 * Result returned by StreamMessageVersionJob
 */
export interface StreamMessageVersionJobResult {
  /** Whether the job completed successfully */
  success: boolean;
  /** ID of the message version that was processed */
  messageVersionId: string;
  /** Final content that was streamed */
  finalContent?: string;
  /** Whether the job was cancelled */
  cancelled?: boolean;
  /** Error message if the job failed */
  error?: string;
}

@Job({
  name: 'StreamMessageVersionJob',
  description: 'Stream AI responses into message versions using Vercel AI SDK',
  schema: StreamMessageVersionSchema,
  maxRetries: 0,  // No retries for streaming jobs
  backoff: 'fixed',
  baseDelay: 1000,
  maxDelay: 5000,
  dedupeKey: (props: StreamMessageVersionJobProps) => `StreamMessageVersionJob:${props.messageVersionId}`,
  timeoutMs: 120000,  // 2 minute timeout for streaming
  retryIf: () => false  // Never retry streaming jobs
})
export class StreamMessageVersionJob extends BaseJob<StreamMessageVersionJobProps> {

  private chatService: ChatService | null = null;

  private messageVersion: MessageVersion | null = null;


  /**
   * Stream AI response into the message version
   */
  async perform(props: StreamMessageVersionJobProps, signal?: AbortSignal): Promise<StreamMessageVersionJobResult> {
    this.log(`🚀 Starting StreamMessageVersionJob for message version: ${props.messageVersionId}`);

    this.chatService = new ChatService({ messageVersionId: props.messageVersionId });

    this.messageVersion = await this.chatService.getMessageVersion(props.messageVersionId);
    this.log(`📋 Retrieved message version: ${this.messageVersion?.id}, status: ${this.messageVersion?.status}`);

    if (!this.messageVersion?.message) {
      return {
        success: false,
        messageVersionId: props.messageVersionId,
        error: 'Message version has no associated message'
      };
    }

    if (this.messageVersion?.status !== MessageVersionStatus.pending) {
      this.log(`❌ Message version ${props.messageVersionId} is not pending (status: ${this.messageVersion?.status}), exiting`);
      return {
        success: false,
        messageVersionId: props.messageVersionId,
        error: `Message version is not pending (status: ${this.messageVersion?.status})`
      };
    }

    this.updateVersion({ status: MessageVersionStatus.streaming });

    const modelMessages = await this.chatService.getModelMessages(props.messageVersionId);
    const modelConfig = await this.chatService.getModelConfig(props.messageVersionId);

    const provider = getOrCreateProviderMinimal(modelConfig.baseUrl, modelConfig.apiKey, modelConfig.kind, modelConfig.customHeaders);

    const model = provider(modelConfig.modelIdentifier);

    let accumulatedText = '';
    this.log(`🌊 Starting AI stream...`);

    try {
      const result = await streamText({
        model,
        system: (await this.chatService.getChat()!).systemPrompt || 'You are a helpful assistant.',
        messages: modelMessages,
        temperature: modelConfig.temperature,
        abortSignal: signal,
        onChunk: async (event) => {
          const chunk = event.chunk;
          if (chunk.type === 'text-delta') {
            accumulatedText += chunk.text;
            this.updateVersion({ content: accumulatedText, status: MessageVersionStatus.streaming });
          }
          // TODO handle other chunk types like images if needed
        },
        onFinish: async () => {
          this.log(`✅ Streaming finished, final text length: ${accumulatedText.length} chars`);
          this.updateVersion({ content: accumulatedText, status: MessageVersionStatus.completed });
        },
        onError: async (event) => {
          this.log('❌ Streaming error:', event);
          this.updateVersion({ status: MessageVersionStatus.failed });
          throw event.error;
        }
      });

      // Check if we were aborted due to cancellation
      if (signal?.aborted) {
        this.log(`⏹️ Streaming aborted via signal for message version ${props.messageVersionId}`);
        this.updateVersion({ status: MessageVersionStatus.cancelled });
        return {
          success: true,
          messageVersionId: props.messageVersionId,
          finalContent: accumulatedText,
          cancelled: true
        };
      }

      // Consume the stream to get the complete response
      const text = await result.text;
      if (text.length > 0) {
        this.log(`📋 Got complete response: ${text.length} chars`);
        accumulatedText = text;
        this.updateVersion({ content: accumulatedText, status: MessageVersionStatus.completed });
      }

      this.log('🏁 StreamText call completed successfully');

      // Clean up after streaming for optimal performance
      try {
        await optimizeAfterStreaming();
        this.log('🧹 Post-streaming cleanup completed');
      } catch (cleanupError) {
        this.log('⚠️ Warning: Post-streaming cleanup failed:', cleanupError);
      }

      return {
        success: true,
        messageVersionId: props.messageVersionId,
        finalContent: accumulatedText
      };
    } catch (error) {
      this.log('💥 StreamText threw an error:', error);

      // Handle abort/cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        this.updateVersion({ status: MessageVersionStatus.cancelled });

        // Clean up after cancellation
        try {
          await optimizeAfterStreaming();
          this.log('🧹 Post-cancellation cleanup completed');
        } catch (cleanupError) {
          this.log('⚠️ Warning: Post-cancellation cleanup failed:', cleanupError);
        }

        return {
          success: true,
          messageVersionId: props.messageVersionId,
          finalContent: accumulatedText,
          cancelled: true
        };
      }

      this.updateVersion({ status: MessageVersionStatus.failed, content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });

      // Clean up after error
      try {
        await optimizeAfterStreaming();
        this.log('🧹 Post-error cleanup completed');
      } catch (cleanupError) {
        this.log('⚠️ Warning: Post-error cleanup failed:', cleanupError);
      }

      return {
        success: false,
        messageVersionId: props.messageVersionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateVersion(fields: Partial<MessageVersion>): Promise<MessageVersion> {
    if (!this.messageVersion) {
      throw new Error('Message version not loaded');
    }
    this.messageVersion = await this.chatService!.update(this.messageVersion, fields);
    return this.messageVersion;
  }
}