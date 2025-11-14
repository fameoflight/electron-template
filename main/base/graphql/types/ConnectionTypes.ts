import { ObjectType } from 'type-graphql';
import { createConnectionType } from '../relay/Connection';
import { User } from '@main/base/db/User';

/**
 * Relay Connection type for User entities
 * Kept for future use with cursor-based pagination
 */
@ObjectType()
export class UserConnection extends createConnectionType('User', User) { }
