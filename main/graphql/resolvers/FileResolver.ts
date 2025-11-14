/**
 * FileResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from FileResolverBase):
 * - Queries: file(id), files(args), filesArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput() (from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { ProcessFileJob } from '@main/jobs/ProcessFileJob.js';
import { CreateFileInput } from '@main/graphql/inputs/FileInputs.js';
import { Resolver, Query, Arg, Ctx, Mutation } from 'type-graphql';
import { FileResolverBase } from './__generated__/FileResolverBase.js';
import { File } from '@db/entities/File.js';
import { IsNull } from 'typeorm';
import type { GraphQLContext } from '@shared/types';

// TODO: rename this to UserFile, File is a very generic name, it's also class name in Node which makes it hard to work with
@Resolver(() => File)
export class FileResolver extends FileResolverBase {
  /**
   * Override createFile to enqueue ProcessFileJob after file creation
   */
  @Mutation(() => File, { description: 'Create new File' })
  async createFile(
    @Arg('input', () => CreateFileInput) input: CreateFileInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<File> {
    // Create the file using the parent implementation
    const file = await super.createFile(input, ctx);

    // Enqueue ProcessFileJob to process the file asynchronously
    // This will extract metadata, calculate hash, detect file type, etc.
    try {
      await ProcessFileJob.performLater(
        ctx.user!.id,
        file.id,
        {}, // ProcessFileJob doesn't need additional parameters
        {
          priority: 50, // Medium priority for file processing
          timeoutMs: 300000 // 5 minutes timeout (matches job definition)
        }
      );

      console.log(`✅ Enqueued ProcessFileJob for file ${file.id} (${file.filename})`);
    } catch (error) {
      console.error(`❌ Failed to enqueue ProcessFileJob for file ${file.id}:`, error);
      // Don't fail the file creation if job enqueueing fails
      // The file can still be processed manually later
    }

    return file;
  }

  /**
   * Custom query to fetch files filtered by ownerType and optional ownerId
   */
  @Query(() => [File], { description: 'Fetch Files by owner type and optional owner ID' })
  async filesByOwnerType(
    @Arg('ownerType', () => String, { nullable: true }) ownerType: string | null,
    @Arg('ownerId', () => String, { nullable: true }) ownerId: string | null,
    @Ctx() ctx: GraphQLContext
  ): Promise<File[]> {
    const where: any = { deletedAt: IsNull() };

    if (ownerType) {
      where.ownerType = ownerType;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    return await this.getRepository(ctx).find({ where });
  }
}