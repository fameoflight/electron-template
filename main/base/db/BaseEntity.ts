import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Node } from '@base/graphql/relay/Node.js';

@ObjectType({ implements: Node })
export abstract class BaseEntity implements Node {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => String)
  get modelId(): string {
    return this.id; // Return the raw UUID, not the global ID
  }

  @Field(() => Date)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field(() => Date, { nullable: true })
  @DeleteDateColumn()
  deletedAt?: Date;

  // Internal property to store the entity type name for Relay
  __typename?: string;
}
