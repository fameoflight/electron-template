/**
 * Chat Factory
 * Factory functions for creating chat test data
 */

import { Chat } from '@main/db/entities/Chat.js';

export interface CreateChatOptions {
  userId?: string;
  title?: string;
  description?: string;
  status?: string;
  llmModelId?: string;
  systemPrompt?: string;
}

export async function createChat(
  dataSource: any,
  options: CreateChatOptions = {}
) {
  const chatRepository = dataSource.getRepository(Chat);

  const defaultOptions = {
    title: 'Test Chat',
    status: 'active',
    llmModelId: options.llmModelId || 'default-llm-model-id',  // Required field
    userId: options.userId || 'test-user-id',
    ...options
  };

  const chat = await chatRepository.save(defaultOptions);
  return chat;
}

export async function createChats(
  dataSource: any,
  count: number,
  options: CreateChatOptions = {}
) {
  const chats = [];
  for (let i = 0; i < count; i++) {
    const chat = await createChat(dataSource, {
      ...options,
      title: options.title ? `${options.title} ${i + 1}` : `Test Chat ${i + 1}`
    });
    chats.push(chat);
  }
  return chats;
}