/**
 * Connection - Custom entity extension
 *
 * This file extends the generated ConnectionBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/Connection.json
 */
import { Entity, Index, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { ConnectionBase } from './__generated__/ConnectionBase.js';


// TODO: hemantv rename this, as Connection is confusing with TypeORM Connection or Relay Connection
// Suggsestion: nothing with Connection in it,  maybe something with Link like RemoteLink, Link is generic too

@Index("IDX_connection_userId", ['userId'])
@ObjectType({ description: 'Connection entity' })
@Entity('connections')
export class Connection extends ConnectionBase { }
