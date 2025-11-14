/**
 * File - Custom entity extension
 *
 * This file extends the generated FileBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/File.json
 */
import { Entity, Index, BeforeInsert, ManyToOne, OneToMany } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { FileBase } from './__generated__/FileBase.js';
import fs from 'fs';

// TODO: rename this to FileLink to avoid confusion with FS File

@Index("IDX_file_fileHash", ['fileHash'])
@Index("IDX_file_fileType", ['fileType'])
@Index("IDX_file_fileType_createdAt", ['fileType', 'createdAt'])
@ObjectType({ description: 'File entity for storing file references with AI-generated descriptions' })
@Entity('files')
export class File extends FileBase {
  // Add custom methods and computed fields here

  // Example: Computed field
  // @Field(() => String, { description: 'Display name' })
  // get displayName(): string {
  //   return `${this.name} (${this.id})`;
  // }

  // Example: Lifecycle hook
  // @BeforeInsert()
  // doSomethingBeforeInsert() {
  //   // Custom logic
  // }

  get data(): Buffer | null {
    const filePath = this.fullPath;
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }
}
