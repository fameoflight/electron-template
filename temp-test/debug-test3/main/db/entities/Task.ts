/**
 * Task - Custom entity extension
 *
 * This file extends the generated TaskBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/Task.json
 */
import { Entity, Index, BeforeInsert } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { TaskBase } from './__generated__/TaskBase.js';

@ObjectType({ description: '' })
@Entity('tasks')
export class Task extends TaskBase {
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
}
