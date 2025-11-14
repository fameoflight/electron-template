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

@InputType()
export class UpdateUserInput {

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
    const repo = this.getBaseRepository(User);
    const user = await repo.findOneByOrFail({ username: input.username! });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.id !== ctx.user?.id) {
      throw new Error('Unauthorized');
    }

    this.safeAssignUpdate(user, input);

    return await repo.save(user);
  }
}