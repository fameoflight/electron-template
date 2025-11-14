/**
 * Message Factory
 * Factory functions for creating message test data
 */

import { Message } from '@main/db/entities/Message.js';
import { MessageVersion } from '@main/db/entities/MessageVersion.js';
import { MessageRole } from '@db/entities/__generated__/MessageBase';
import { MessageVersionStatus } from '@db/entities/__generated__/MessageVersionBase';

export interface CreateMessageOptions {
  chatId?: string;
  role?: MessageRole;
  content?: string;
  versionStatus?: MessageVersionStatus;
  llmModelId?: string;
  userId?: string;
}

export async function createMessage(
  dataSource: any,
  options: CreateMessageOptions = {}
) {
  const messageRepository = dataSource.getRepository(Message);
  const messageVersionRepository = dataSource.getRepository(MessageVersion);

  const defaultOptions = {
    role: MessageRole.user,
    content: 'Test message content',
    versionStatus: MessageVersionStatus.completed,
    llmModelId: 'test-llm-model-id',
    userId: options.userId || 'test-user-id',
    ...options
  };

  // Step 1: Create MessageVersion first
  const messageVersion = await messageVersionRepository.save({
    content: defaultOptions.content,
    isRegenerated: false,
    llmModelId: defaultOptions.llmModelId,
    status: defaultOptions.versionStatus,
    userId: defaultOptions.userId
  });

  // Step 2: Create Message with the version reference
  const message = await messageRepository.save({
    chat: defaultOptions.chatId ? { id: defaultOptions.chatId } : undefined,
    role: defaultOptions.role,
    content: defaultOptions.content,
    currentVersionId: messageVersion.id,
    llmModelId: defaultOptions.llmModelId,
    userId: defaultOptions.userId
  });

  // Step 3: Update MessageVersion with the messageId
  await messageVersionRepository.update(messageVersion.id, {
    messageId: message.id
  });

  return message;
}

export async function createMessages(
  dataSource: any,
  count: number,
  options: CreateMessageOptions = {}
) {
  const messages = [];
  for (let i = 0; i < count; i++) {
    const message = await createMessage(dataSource, {
      ...options,
      content: options.content || `Test message ${i + 1}`
    });
    messages.push(message);
  }
  return messages;
}

export async function createConversation(
  dataSource: any,
  chatId: string,
  conversation: Array<{ role: MessageRole; content: string }>,
  userId?: string
) {
  const messages = [];
  for (let i = 0; i < conversation.length; i++) {
    const message = await createMessage(dataSource, {
      chatId,
      role: conversation[i].role,
      content: conversation[i].content,
      versionStatus: MessageVersionStatus.completed,
      userId
    });
    messages.push(message);
  }
  return messages;
}