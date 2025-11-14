/**
 * MessageVersion - Custom entity extension
 *
 * This file extends the generated MessageVersionBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/MessageVersion.json
 */
import { Entity, Index, BeforeInsert, OneToMany, In } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { MessageVersionBase } from './__generated__/MessageVersionBase.js';
import { File } from './File.js';
import { getFiles } from '@main/db/utils/index.js';
import { DataSourceProvider } from '@base/db/index.js';

@Index("IDX_messageversion_messageId", ['messageId'])
@Index("IDX_messageversion_llmModelId", ['llmModelId'])
@Index("IDX_messageversion_createdAt", ['createdAt'])
@Index("IDX_messageversion_messageId_createdAt", ['messageId', 'createdAt'])
@Index("IDX_messageversion_llmModelId_createdAt", ['llmModelId', 'createdAt'])
@ObjectType({ description: 'Message version entity for supporting response regeneration and version comparison' })
@Entity('message_versions')
export class MessageVersion extends MessageVersionBase {
  // Add custom relations
  @Field(() => [File], { description: 'Files attached to this message version' })
  async files(): Promise<File[]> {
    return getFiles({ ownerId: this.id, ownerType: 'MessageVersion' });
  }

  // Add custom methods and computed fields here

  /**
   * Attach files to this message version using polymorphic relationship
   */
  async attachFiles(fileIds: string[]): Promise<void> {
    const dataSource = DataSourceProvider.get();
    const fileRepository = dataSource.getRepository(File);

    // Update all files to be owned by this message version
    await fileRepository.update(
      { id: In(fileIds) },
      {
        ownerId: this.id,
        ownerType: 'MessageVersion'
      }
    );
  }

  /**
   * Check if this is the original version (not regenerated)
   */
  get isOriginal(): boolean {
    return !this.isRegenerated;
  }

  /**
   * Get version generation number (1 for original, 2+ for regenerations)
   */
  get generationNumber(): number {
    if (!this.isRegenerated) return 1;

    // Simple estimation - in a real implementation, you'd trace the full lineage
    return 2; // Placeholder for now
  }

  /**
   * Get human-readable version label
   */
  get versionLabel(): string {
    if (this.isOriginal) {
      return 'Original';
    }
    return `Version ${this.generationNumber}`;
  }

  /**
   * Check if this version has performance metrics
   */
  get hasPerformanceMetrics(): boolean {
    return this.contextTokens !== undefined && this.generationTime !== undefined;
  }

  /**
   * Get tokens per second metric if available
   */
  get tokensPerSecond(): number | null {
    if (!this.hasPerformanceMetrics || !this.contextTokens || !this.generationTime) {
      return null;
    }
    return Math.round((this.contextTokens / this.generationTime) * 1000);
  }

  // Example: Lifecycle hook
  // @BeforeInsert()
  // doSomethingBeforeInsert() {
  //   // Custom logic
  // }
}
