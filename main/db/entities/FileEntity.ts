/**
 * FileEntity - Custom entity extension
 *
 * This file extends the generated FileEntityBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/FileEntity.json
 */
import { Entity, Index, OneToMany } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import fs, { createReadStream } from 'fs';
import { FileEntityBase, FileEntityFileType } from './__generated__/FileEntityBase.js';
import crypto from 'crypto';


@Index("IDX_fileentity_fileHash", ['fileHash'])
@Index("IDX_fileentity_fileType", ['fileType'])
@Index("IDX_fileentity_fileType_createdAt", ['fileType', 'createdAt'])
@ObjectType({ description: 'File entity for storing file references with AI-generated descriptions' })
@Entity('file_entities')
export class FileEntity extends FileEntityBase {
  get data(): Buffer | null {
    const filePath = this.fullPath;
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }

  async calculateHash(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(this.fullPath);
      stream.on('error', (err) => reject(err));
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }
}
