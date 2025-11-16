/**
 * FileEntityResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from FileEntityResolverBase):
 * - Queries: fileEntity(id), fileEntities(args), fileEntitiesArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput() (from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Resolver, Query, Arg, Ctx, Mutation, Args } from 'type-graphql';
import { FileEntityResolverBase } from './__generated__/FileEntityResolverBase.js';
import { FileEntity } from '@db/entities/FileEntity.js';
import type { GraphQLContext } from '@shared/types';
import { CreateFileEntityInput } from '@main/graphql/inputs/FileEntityInputs.js';
import { FileEntityStatus } from '@main/db/entities/__generated__/FileEntityBase.js';
import { fromGlobalIdToLocalId } from '@base/graphql/index';
import { ConnectionArgs } from '@base/graphql/relay/Connection';
import { connectionFromArray } from '@base/graphql/relay/Connection';
import { IsNull } from 'typeorm';
import { FileEntityConnection } from './__generated__/FileEntityResolverBase.js';

@Resolver(() => FileEntity)
export class FileEntityResolver extends FileEntityResolverBase {
  @Mutation(() => FileEntity, { description: 'Create file with deduplication' })
  async createFileEntity(
    @Arg('input', () => CreateFileEntityInput) input: CreateFileEntityInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<FileEntity> {
    const repository = this.getRepository(ctx);

    // Check if file already exists with the same path (basic duplicate check)
    const existingFile = await repository.findOne({
      where: {
        fullPath: input.fullPath,
        userId: ctx.user?.id
      }
    });

    if (existingFile) {
      // File already exists, return the existing file
      console.log(`File already exists: ${existingFile.filename} (${existingFile.id})`);
      return existingFile;
    }

    // Use the base resolver's create method but set status to pending
    const entity = repository.create(input);

    // Auto-attach userId and set status
    if (ctx.user) {
      entity.userId = ctx.user.id;
    }
    entity.status = FileEntityStatus.pending;

    const file = await repository.save(entity);

    // Trigger file processing to calculate hash and check for duplicates
    // This runs in background, so we don't block the upload response
    setTimeout(() => {
      this.triggerFileProcessing(file.id, ctx.user?.id || '');
    }, 100);

    return file;
  }

  /**
   * Fetch FileEntity by ID with graceful error handling for invalid global IDs
   */
  @Query(() => FileEntity, { nullable: true, description: 'Fetch FileEntity by ID' })
  async fileEntity(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<FileEntity | null> {
    try {
      const localId = fromGlobalIdToLocalId(id);
      return await this.getRepository(ctx).findOne({ where: { id: localId } });
    } catch (error) {
      // Handle invalid global ID format gracefully
      console.log('Invalid global ID format, returning null:', id);
      return null;
    }
  }

  /**
   * Fetch FileEntity collection (Relay connection) with graceful authentication handling
   */
  @Query(() => FileEntityConnection, { description: 'Fetch FileEntity collection (paginated)' })
  async fileEntities(
    @Args(() => ConnectionArgs) args: ConnectionArgs,
    @Arg('kind', () => String, { defaultValue: 'default' }) kind: 'default' | 'all',
    @Ctx() ctx: GraphQLContext
  ): Promise<ReturnType<typeof connectionFromArray<FileEntity>>> {
    // Handle unauthenticated requests gracefully by returning empty connection
    if (!ctx?.user?.id) {
      return connectionFromArray([], args, 0);
    }

    const where = kind === 'default' ? { deletedAt: IsNull() } : {};
    const [items, totalCount] = await this.getRepository(ctx).findAndCount({ where });
    return connectionFromArray(items, args, totalCount);
  }

  /**
   * Fetch FileEntity array (non-paginated) with graceful authentication handling
   */
  @Query(() => [FileEntity], { description: 'Fetch FileEntity array' })
  async fileEntitiesArray(
    @Arg('kind', () => String, { defaultValue: 'default' }) kind: 'default' | 'all',
    @Ctx() ctx: GraphQLContext
  ): Promise<FileEntity[]> {
    // Handle unauthenticated requests gracefully by returning empty array
    if (!ctx?.user?.id) {
      return [];
    }

    if (kind === 'all') {
      return await this.getRepository(ctx).find({ withDeleted: true });
    }
    return await this.getRepository(ctx).find();
  }

  /**
   * Find file by hash (for duplicate checking)
   */
  @Query(() => FileEntity, { nullable: true, description: 'Find file by content hash' })
  async findFileEntityByHash(
    @Arg('fileHash', () => String) fileHash: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<FileEntity | null> {
    // Handle unauthenticated requests gracefully by returning null
    if (!ctx?.user?.id) {
      return null;
    }

    return await this.getRepository(ctx).findOne({
      where: {
        fileHash,
        userId: ctx.user?.id,
        status: FileEntityStatus.completed
      }
    });
  }

  /**
   * Helper method to trigger file processing
   */
  private async triggerFileProcessing(fileId: string, userId: string): Promise<void> {
    try {
      const { ProcessFileJob } = await import('@main/jobs/ProcessFileJob.js');
      await ProcessFileJob.performLater(userId, fileId);
      console.log(`Triggered ProcessFileJob for file ${fileId}`);
    } catch (error) {
      console.error(`Failed to trigger ProcessFileJob for file ${fileId}:`, error);
    }
  }
}
