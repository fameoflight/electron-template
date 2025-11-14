/**
 * User - Base entity for authentication and ownership
 *
 * Extends BaseEntity to inherit common fields (id, timestamps, soft delete).
 * Does NOT extend OwnedEntity because User is the root owner entity.
 *
 * Single Responsibility: Represent authenticated users in the system
 */
import { Entity, Index, BeforeInsert, Column } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { randomUUID } from 'node:crypto';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { BaseEntity } from './BaseEntity.js';

@Index("IDX_user_username", ['username'])
@Index("IDX_user_sessionKey", ['sessionKey'])
@ObjectType({ description: 'User entity' })
@Entity('users')
export class User extends BaseEntity {
  @BeforeInsert()
  generateSessionKey() {
    if (!this.sessionKey) {
      this.sessionKey = randomUUID();
    }
  }

  @Field(() => String, { description: 'User name' })
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @Field(() => String, { description: 'Unique username' })
  @Column({ type: 'varchar', unique: true, length: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username!: string;

  @Field(() => String, { description: 'User password' })
  @Column({ type: 'varchar' })
  @IsString()
  @MinLength(8)
  password!: string;

  @Field(() => String, { description: 'Session key for user authentication', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsString()
  sessionKey?: string;

  // typeorm json column to store arbitrary user metadata
  @Column({ type: 'json', nullable: true })
  metadata?: any;
}
