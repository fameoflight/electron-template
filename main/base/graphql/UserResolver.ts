/**
 * UserResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from UserResolverBase):
 * - Queries: user(id), users(args), usersArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput() (from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Resolver, Query, Mutation, Arg, Ctx, InputType, Field } from 'type-graphql';
import { User } from '@main/base/db/User.js';
import type { GraphQLContext } from '@shared/types';
import JobQueue from '@main/services/JobQueue.js';
import { BaseResolver } from '@main/base/index.js';
import { BaseInput } from '@main/base/graphql/BaseInput.js';
import { MinLength, MaxLength, validate, IsString } from 'class-validator';

@InputType()
export class LoginInput {
  @Field(() => String)
  username!: string;

  @Field(() => String)
  password!: string;
}

@InputType()
export class CreateUserInput extends LoginInput {
  @Field(() => String)
  name!: string;
}

class NameValidationInput {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
}

@InputType()
export class UpdateUserInput extends BaseInput {

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  username?: string;

  @Field(() => String, { nullable: true })
  password?: string;

  @Field(() => String, { nullable: true })
  sessionKey?: string;
}


@Resolver(() => User)
export class UserResolver extends BaseResolver {

  protected async validateInput<T>(input: T): Promise<T> {
    // For UpdateUserInput, only validate fields that are actually provided
    const inputObj = input as any;

    if (inputObj.constructor.name === 'UpdateUserInput') {
      // Only validate if name field is provided
      if (inputObj.name !== undefined && inputObj.name !== '') {
        // Create a temporary object with just the name for validation
        const tempInput = new NameValidationInput();
        tempInput.name = inputObj.name;
        const errors = await validate(tempInput);
        if (errors.length > 0) {
          const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
          throw new Error(`Validation failed: ${messages}`);
        }
      } else if (inputObj.name === '') {
        // Empty string should fail validation
        throw new Error('Validation failed: name must be longer than or equal to 1 characters');
      }

      // Skip BaseInput validation for UpdateUserInput to avoid default value issues
      return input;
    }

    // For all other inputs, use the normal BaseInput validation
    return await super.validateInput(input);
  }

  @Query(() => User, { nullable: true })
  async currentUser(@Ctx() ctx: GraphQLContext): Promise<User | null> {
    // If no user in context, return null
    if (!ctx.user || !ctx.user.id) {
      return null;
    }

    // Find user by ID
    const user = await this.getBaseRepository(User).findOne({
      where: {
        id: ctx.user.id
      }
    });

    return user || null;
  }

  @Mutation(() => User)
  async login(@Arg('input', () => LoginInput) input: LoginInput): Promise<User> {
    const user = await this.getRawRepository(User).findOne({
      where: { username: input.username },
      select: ['id', 'name', 'username', 'password', 'sessionKey', 'metadata', 'createdAt', 'updatedAt', 'deletedAt']
    });
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Note: In a real app, you'd hash the password and compare it
    if (user.password !== input.password) {
      throw new Error('Invalid username or password');
    }

    // Configure JobQueue with user's settings


    return user;
  }

  @Mutation(() => User, { nullable: true })
  async validateSessionKey(@Arg('sessionKey', () => String) sessionKey: string): Promise<User | null> {
    const user = await this.getBaseRepository(User).findOne({
      where: { sessionKey },
    });


    if (user) {
      const queue = JobQueue.getInstance();
      queue?.setUser(user);
    }
    return user;
  }

  @Mutation(() => User)
  async createUser(@Arg('input', () => CreateUserInput) input: CreateUserInput): Promise<User> {
    const user = this.getBaseRepository(User).create({
      name: input.name,
      username: input.username,
      password: input.password
    });
    return await this.getBaseRepository(User).save(user);
  }

  @Mutation(() => User)
  async updateUser(
    @Ctx() ctx: GraphQLContext,
    @Arg('input', () => UpdateUserInput) input: UpdateUserInput
  ): Promise<User> {
    if (!ctx.user?.id) {
      throw new Error('Authentication required');
    }

    // Validate input using BaseInput validation
    await this.validateInput(input);

    const repo = this.getBaseRepository(User);
    const user = await repo.findOneByOrFail({ id: ctx.user.id });

    // Username change is not allowed - remove it from input if present
    if (input.username !== undefined) {
      throw new Error('Cannot change username');
    }

    this.safeAssignUpdate(user, input);

    return await repo.save(user);
  }
}