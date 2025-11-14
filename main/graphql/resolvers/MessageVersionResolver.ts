/**
 * MessageVersionResolver - Custom resolver extending generated base
 *
 * ✅ EDIT THIS FILE to add custom queries and mutations
 * ⚠️  This file is created once and never overwritten
 *
 * Generated base provides (from MessageVersionResolverBase):
 * - Queries: messageVersion(id), messageVersions(args), messageVersionsArray(kind)
 * - Mutations: create, update, createUpdate, destroy, delete, restore
 * - Helpers: validateInput()(from BaseResolver)
 *
 * Add your custom business logic below!
 */

import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { MessageVersionResolverBase } from './__generated__/MessageVersionResolverBase.js';
import { MessageVersion } from '@db/entities/MessageVersion.js';
import type { GraphQLContext } from '@shared/types';

@Resolver(() => MessageVersion)
export class MessageVersionResolver extends MessageVersionResolverBase { }
