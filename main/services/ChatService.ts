import { BaseService } from "./BaseService.js";
import { MessageRole } from "@main/db/entities/__generated__/MessageBase.js";
import { Chat } from "@main/db/entities/Chat.js";
import { File } from "@main/db/entities/File.js";
import { LLMModel, LLMModelConfig } from "@main/db/entities/LLMModel.js";
import { Message } from "@main/db/entities/Message.js";
import { MessageVersion } from "@main/db/entities/MessageVersion.js";
import { AssistantModelMessage, ModelMessage, SystemModelMessage, UserModelMessage } from "ai";
import { In } from "typeorm";

async function getChat(opts: ChatServiceOptions): Promise<Chat | null> {
  if (!opts.chatId && !opts.messageId && !opts.messageVersionId) {
    throw new Error('ChatService requires at least one of chatId, messageId, or messageVersionId');
  }

  const tempService = new ChatService({});
  const { chatRepository, messageRepository, messageVersionRepository } = tempService.getRepositories();

  if (opts.chatId) {
    return chatRepository.findOne({ where: { id: opts.chatId } });
  }
  if (opts.messageId) {
    return messageRepository.findOne({ where: { id: opts.messageId }, relations: ['chat'] })
      .then(message => message ? message.chat : null);
  }
  if (opts.messageVersionId) {
    const messageVersion = await messageVersionRepository.findOne({ where: { id: opts.messageVersionId } });

    const message = await messageVersion?.message;

    return await message?.chat || null;
  }
  return Promise.resolve(null);
}

interface ChatServiceOptions {
  chatId?: string;
  messageId?: string;
  messageVersionId?: string;
}

class ChatService extends BaseService {
  private chat: Chat | null = null;
  private opts: ChatServiceOptions;
  private messageVersionFileIds: Map<string, File[]> = new Map();

  constructor(opts: ChatServiceOptions) {
    super();
    this.opts = opts;
  }

  protected getServiceName(): string {
    return 'ChatService';
  }

  async getChat(): Promise<Chat> {
    if (this.chat) {
      return this.chat;
    }
    const chat = await getChat(this.opts);

    if (!chat) {
      throw new Error('Chat not found for provided identifiers');
    }

    const chatId = chat.id;

    // Fetch chat with relations messages and versions (including reverse relation)
    const { chatRepository } = this.getRepositories();
    const chatWithRelations = await chatRepository.findOne({
      where: { id: chatId },
      relations: ['messages', 'messages.versions', 'messages.versions.message']
    });

    const messages = await chatWithRelations?.messages || [];
    const messageVersionIds: string[] = [];
    for (const msg of messages) {
      const versions = await msg.versions || [];
      messageVersionIds.push(...versions.map(v => v.id));
    }

    // Find files using polymorphic relationship
    const files = await this.dataSource.getRepository(File).find({
      where: {
        ownerId: In(messageVersionIds),
        ownerType: 'MessageVersion'
      }
    });

    for (const file of files) {
      if (!this.messageVersionFileIds.has(file.ownerId!)) {
        this.messageVersionFileIds.set(file.ownerId!, []);
      }
      this.messageVersionFileIds.get(file.ownerId!)!.push(file);
    }

    if (!chatWithRelations) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }

    this.chat = chatWithRelations;
    return this.chat;
  }

  async getMessage(messageId: string): Promise<Message | null> {
    const chat = await this.getChat();
    const messages = await chat.messages || [];
    return messages.find(msg => msg.id === messageId) || null;
  }

  async getMessageVersion(messageVersionId: string): Promise<MessageVersion | null> {
    const chat = await this.getChat();
    const messages = await chat.messages || [];
    for (const message of messages) {
      const versions = await message.versions || [];
      const version = versions.find(v => v.id === messageVersionId);
      if (version) {
        return version;
      }
    }
    return null;
  }

  async updateEntity<T extends Chat | Message | MessageVersion>(object: T, fields: Partial<T>): Promise<T> {
    return super.update(object, fields);
  }


  // get messages with message versions
  async getMessages(): Promise<Message[]> {
    const chat = await this.getChat();
    return await chat?.messages || [];
  }

  async getModelConfig(targetVersionId: string): Promise<LLMModelConfig> {
    const chat = await this.getChat();
    const targetVersion = await this.getMessageVersion(targetVersionId);

    const llmModelId = targetVersion?.llmModelId || chat.llmModelId;
    const llmModel = await this.dataSource.getRepository(LLMModel).findOne({ where: { id: llmModelId } });

    if (!llmModel) {
      throw new Error(`LLM Model not found for ID: ${llmModelId}`);
    }

    return llmModel.getModelConfig();
  }

  async getModelMessages(targetVersionId: string): Promise<ModelMessage[]> {
    const messages = await this.getMessages();

    const modelMessages: ModelMessage[] = [];

    for (const message of messages) {
      const versions = await message.versions || [];
      const currentVersion = versions.find(v => v.id === message.currentVersionId) || versions[0];

      const targetVersion = versions.find(v => v.id === targetVersionId);

      if (targetVersion) {
        break;
      }

      const modelMessage = await this.getModelMessage(currentVersion);
      if (modelMessage) {
        modelMessages.push(modelMessage);
      }
    }

    return modelMessages;
  }

  async getModelMessage(messageVersion: MessageVersion): Promise<ModelMessage | null> {
    const message = await messageVersion.message;
    if (!message) {
      return null;
    }
    switch (message.role) {
      case MessageRole.user:
        return await this.getUserModelMessage(messageVersion);
      case MessageRole.assistant:
        return {
          role: "assistant",
          content: [
            { type: "text", text: messageVersion.content }
          ]
        } as AssistantModelMessage;
      case MessageRole.system:
        return {
          role: "system",
          content: messageVersion.content
        } as SystemModelMessage;
      default:
        throw new Error(`Unknown message role: ${message.role}`);
    }
  }

  async getUserModelMessage(messageVersion: MessageVersion): Promise<UserModelMessage> {
    const message = await messageVersion.message;
    if (!message) {
      throw new Error('MessageVersion has no associated Message');
    }
    if (message.role !== MessageRole.user) {
      throw new Error('MessageVersion is not of role user');
    }

    const files = this.messageVersionFileIds.get(messageVersion.id) || [];

    const content: UserModelMessage['content'] = [
      { type: "text", text: messageVersion.content },
    ];

    for (const file of files) {
      // TODO: handle other file types as needed
      if (file.fileType !== 'image') {
        continue;
      }

      const data = file.data;
      if (!data) {
        continue;
      }

      content.push({
        type: "image",
        image: data,
      });
    }

    return {
      role: "user",
      content: content
    };
  }
}

export default ChatService;