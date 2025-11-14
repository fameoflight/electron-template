/**
 * TestEntity - Custom entity extension
 *
 * This file extends the generated TestEntityBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/TestEntity.json
 */
import { Entity, Index, BeforeInsert } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { TestEntityBase } from './__generated__/TestEntityBase.js';

@ObjectType({ description: '' })
@Entity('test_entities')
export class TestEntity extends TestEntityBase {
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
