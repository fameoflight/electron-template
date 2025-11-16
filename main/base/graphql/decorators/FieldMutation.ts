import 'reflect-metadata';
import { Mutation, Arg, Ctx } from 'type-graphql';
import type { BaseInput } from '../BaseInput.js';
import type { GraphQLContext } from '@shared/types';

/**
 * Options for configuring a field mutation
 */
export interface FieldMutationOptions {
  /**
   * GraphQL description for the mutation
   */
  description?: string;

  /**
   * Whether the mutation can return null
   * @default false
   */
  nullable?: boolean;

  /**
   * Automatically validate input before calling mutation
   * Calls input.validate() which runs class-validator decorators
   * @default true
   */
  autoValidate?: boolean;
}

/**
 * Constructor type for class instantiation
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * Unified decorator for GraphQL mutations with automatic input validation
 *
 * Combines @Mutation, @Arg, and @Ctx decorators while enforcing BaseInput constraint
 * and providing automatic validation. Significantly reduces decorator boilerplate.
 *
 * @param InputClass - Input class that extends BaseInput (enforced at compile time)
 * @param OutputClass - Output type for the mutation
 * @param options - Mutation configuration options
 *
 * ## Magical API - Type-Safe Mutations
 * ```typescript
 * // Before: 3 decorators + manual validation
 * @Mutation(() => Message, { description: 'Send message' })
 * async sendMessage(
 *   @Arg('input', () => SendMessageInput) input: SendMessageInput,
 *   @Ctx() ctx: GraphQLContext
 * ): Promise<Message> {
 *   await input.validate(); // Manual validation
 *   // ... mutation logic
 * }
 *
 * // After: 1 decorator + auto-validation
 * @FieldMutation(SendMessageInput, Message, {
 *   description: 'Send message (creates new chat if chatId is not provided)'
 * })
 * async sendMessage(
 *   input: SendMessageInput,  // Auto-typed from decorator!
 *   ctx: GraphQLContext       // Auto-injected!
 * ): Promise<Message> {
 *   // Validation already done, just write business logic
 *   // ... mutation logic
 * }
 * ```
 *
 * ## Features
 * - **Type Safety**: Enforces BaseInput constraint at compile time via generics
 * - **Auto-Validation**: Calls input.validate() before mutation (configurable)
 * - **Auto-Injection**: Applies @Ctx() decorator automatically
 * - **60% Less Boilerplate**: One decorator replaces three
 * - **Standard Errors**: Throws exceptions that GraphQL catches (no wrapper types)
 *
 * ## Examples
 * ```typescript
 * // Simple mutation with auto-validation
 * @FieldMutation(CreateChatInput, Chat, { description: 'Create new chat' })
 * async createChat(input: CreateChatInput, ctx: GraphQLContext): Promise<Chat> {
 *   const userId = this.validateAuth(ctx);
 *   return await ChatService.createChat(input, userId);
 * }
 *
 * // Mutation that can return null
 * @FieldMutation(UpdateMessageInput, Message, {
 *   description: 'Update message',
 *   nullable: true
 * })
 * async updateMessage(input: UpdateMessageInput, ctx: GraphQLContext): Promise<Message | null> {
 *   const userId = this.validateAuth(ctx);
 *   return await MessageService.updateMessage(input.id, input, userId);
 * }
 *
 * // Skip auto-validation if input has custom validation logic
 * @FieldMutation(CustomInput, Result, {
 *   description: 'Complex operation',
 *   autoValidate: false
 * })
 * async complexOperation(input: CustomInput, ctx: GraphQLContext): Promise<Result> {
 *   // Handle validation manually
 *   await input.customValidate();
 *   // ... mutation logic
 * }
 * ```
 *
 * ## Error Handling
 * Just throw exceptions! GraphQL catches them and returns in the `errors` array:
 * ```typescript
 * @FieldMutation(SendMessageInput, Message, { description: 'Send message' })
 * async sendMessage(input: SendMessageInput, ctx: GraphQLContext): Promise<Message> {
 *   const llmModel = await this.getRepository(LLMModel).findOne({ ... });
 *
 *   if (!llmModel) {
 *     throw new Error('LLM model not found'); // ✅ GraphQL handles this
 *   }
 *
 *   return await MessageService.createMessage(...);
 * }
 * ```
 *
 * GraphQL response:
 * ```json
 * {
 *   "data": { "sendMessage": null },
 *   "errors": [
 *     {
 *       "message": "LLM model not found",
 *       "path": ["sendMessage"]
 *     }
 *   ]
 * }
 * ```
 */
export function FieldMutation<
  TInput extends BaseInput,
  TOutput
>(
  InputClass: Constructor<TInput>,
  OutputClass: Constructor<TOutput>,
  options: FieldMutationOptions = {}
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    // Wrap method with auto-validation
    descriptor.value = async function (input: TInput, ctx: GraphQLContext) {
      // Convert plain object to class instance (enables ID transformation)
      input = (InputClass as any).fromObject(input);

      // Auto-validate input before calling mutation (unless disabled)
      if (options.autoValidate !== false) {
        await input.validate();
      }

      // Call original method with validated input
      return originalMethod.call(this, input, ctx);
    };

    // Apply Type-GraphQL decorators

    // 1. @Mutation decorator - defines GraphQL mutation
    Mutation(() => OutputClass, {
      description: options.description,
      nullable: options.nullable ?? false
    })(target, propertyKey, descriptor);

    // 2. @Arg decorator - defines input argument (parameter index 0)
    Arg('input', () => InputClass)(target, propertyKey, 0);

    // 3. @Ctx decorator - injects GraphQL context (parameter index 1)
    Ctx()(target, propertyKey, 1);

    return descriptor;
  };
}
