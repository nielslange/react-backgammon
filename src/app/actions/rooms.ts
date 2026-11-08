'use server';

/** Server Actions for rooms: read the visitor, write with the service role. */
import { createServiceClient, currentUserId } from '../../lib/supabase/server';
import {
	createRoom as create,
	describeRoom as describe,
	joinRoom as join,
	rematch as nextGame,
	type CreateRoomInput,
	type JoinResult,
	type RoomView,
} from '../../server/rooms';
import { toResult, type Result } from '../../server/result';
import { supabaseDb } from '../../server/supabaseDb';

export const createRoom = async ( input: CreateRoomInput ): Promise< Result< { code: string } > > =>
	toResult( async () => create( supabaseDb( createServiceClient() ), await currentUserId(), input ) );

export const joinRoom = async ( input: { code: string; name: string } ): Promise< Result< JoinResult > > =>
	toResult( async () => join( supabaseDb( createServiceClient() ), await currentUserId(), input ) );

export const describeRoom = async ( code: string ): Promise< Result< RoomView > > =>
	toResult( async () => describe( supabaseDb( createServiceClient() ), await currentUserId(), code ) );

export const rematch = async ( input: {
	roomId: string;
	after: number;
} ): Promise< Result< { gameId: string; number: number } > > =>
	toResult( async () => nextGame( supabaseDb( createServiceClient() ), await currentUserId(), input ) );
