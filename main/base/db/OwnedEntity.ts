import { Column, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { BaseEntity } from './BaseEntity.js';
import { User } from './User.js';

/**
 * Base class for entities that are owned by a user.
 * All entities extending this class will have a userId field and a user relation.
 *
 * Single Responsibility: Provide user ownership to entities
 */
@ObjectType()
export abstract class OwnedEntity extends BaseEntity {
  @Field(() => String, { description: 'User who owns this entity' })
  @Column({ type: 'varchar', nullable: false })
  userId!: string;

  @Field(() => User)
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
