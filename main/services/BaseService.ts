import { DataSourceProvider } from '@base/db/index.js';
import { Message } from '@db/entities/Message.js';
import { Chat } from '@db/entities/Chat.js';
import { MessageVersion } from '@db/entities/MessageVersion.js';
import { FileEntity } from '@db/entities/FileEntity.js';
import { CustomDataSource } from '@main/base/CustomDataSource.js';
import { ObjectLiteral } from 'typeorm';

/**
 * BaseService - Common patterns for all services
 *
 * Provides:
 * - Consistent repository access
 * - Standardized logging methods
 * - Common database operations
 */
export abstract class BaseService {
  protected dataSource: CustomDataSource;

  static getRepository<T>(entity: { new(): T }) {
    const dataSource = DataSourceProvider.get();
    return dataSource.getRepository(entity);
  }

  constructor() {
    this.dataSource = DataSourceProvider.get();
  }

  /**
   * Get repositories for common entities
   */
  getRepositories() {
    return {
      messageRepository: this.dataSource.getRepository(Message),
      chatRepository: this.dataSource.getRepository(Chat),
      messageVersionRepository: this.dataSource.getRepository(MessageVersion),
      fileRepository: this.dataSource.getRepository(FileEntity)
    };
  }

  /**
   * Log operation with consistent formatting using service name
   */
  log(message: string, ...args: any[]): void {
    const serviceName = this.getServiceName();
    console.log(`[${serviceName}] ${message}`, ...args);
  }

  /**
   * Log error with consistent formatting using service name
   */
  logError(message: string, error?: any): void {
    const serviceName = this.getServiceName();
    console.error(`[${serviceName}] ${message}`, error);
  }

  /**
   * Generic update method for any entity
   */
  async update<T extends object>(object: T, fields: Partial<T>): Promise<T> {
    const repository = this.dataSource.getRepository(object.constructor.name);
    Object.assign(object, fields);
    return await repository.save(object);
  }

  async getById<T extends ObjectLiteral>(entity: { new(): T }, id: string): Promise<T | null> {
    const repository = this.dataSource.getRepository(entity);
    return await repository.findOne({ where: { id } as any });
  }

  /**
   * Get service name for logging (to be implemented by subclasses)
   */
  protected abstract getServiceName(): string;
}