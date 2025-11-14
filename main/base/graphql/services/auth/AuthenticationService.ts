import { DataSourceProvider } from '@base/db/index.js';
import { User } from '@main/base/db/User.js';
import type { GraphQLContext } from '@shared/types';

/**
 * Centralized authentication service
 * Eliminates duplication between BaseResolver and BaseMutationNamespace
 */
export class AuthenticationService {
  /**
   * Get the current user from context using sessionKey
   * @param context GraphQL context
   * @returns Current user or throws error if not authenticated
   */
  static async getCurrentUser(context: GraphQLContext): Promise<User> {
    if (!context.user) {
      throw new Error('Unauthorized: No user found in context');
    }

    const repository = DataSourceProvider.get().getRepository(User);
    const user = await repository.findOne({ where: { id: context.user.id } });

    if (!user) {
      throw new Error('Unauthorized: Invalid user');
    }

    return user;
  }

  /**
   * Get the current user ID from context
   * @param context GraphQL context
   * @returns Current user ID or throws error if not authenticated
   */
  static async getCurrentUserId(context: GraphQLContext): Promise<string> {
    const user = await this.getCurrentUser(context);
    return user.id;
  }

  /**
   * Get the current user from context, but return null if not authenticated
   * @param context GraphQL context
   * @returns Current user or null if not authenticated
   */
  static async getCurrentUserOrNull(context: GraphQLContext): Promise<User | null> {
    if (!context.user) {
      return null;
    }

    const repository = DataSourceProvider.get().getRepository(User);
    const user = await repository.findOne({ where: { id: context.user.id } });

    return user || null;
  }

  /**
   * Validate a session key and return the user ID, including soft-deleted users
   * This is needed for operations like restore where the user might be soft deleted
   * @param sessionKey The session key to validate
   * @returns The user ID if valid, throws error if invalid
   */
  static async validateSessionKeyWithDeleted(sessionKey: string): Promise<string> {
    if (!sessionKey) {
      throw new Error('Unauthorized: No session key provided');
    }

    const userRepo = DataSourceProvider.get().getRepository(User);

    const user = await userRepo.findOne({
      where: { sessionKey },
      withDeleted: true
    });

    if (!user) {
      throw new Error('Unauthorized: Invalid session key');
    }

    return user.id;
  }

  /**
   * Verify that a user has access to perform an operation
   * This can be extended with role-based access control (RBAC) in the future
   * @param user Current user
   * @param requiredRole Optional role requirement
   * @returns true if user has access, throws error otherwise
   */
  static verifyAccess(user: User, requiredRole?: string): boolean {
    if (!user) {
      throw new Error('Unauthorized: User not authenticated');
    }

    // Future: Add RBAC logic here
    // if (requiredRole && !user.roles.includes(requiredRole)) {
    //   throw new Error(`Forbidden: Requires ${requiredRole} role`);
    // }

    return true;
  }
}
