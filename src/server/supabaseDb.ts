/** The Db port on Supabase (service role: bypasses row-level security). */
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Db, GameRow, MoveRow, RoomRow } from './db';
import { ServerError } from './errors';

const UNIQUE_VIOLATION = '23505';

const fail = ( error: PostgrestError ): never => {
	throw new ServerError( 'SERVER_ERROR', error.message );
};

export const supabaseDb = ( client: SupabaseClient ): Db => ( {
	async insertRoom( row ) {
		const { data, error } = await client.from( 'rooms' ).insert( row ).select().single();
		if ( error?.code === UNIQUE_VIOLATION ) throw new ServerError( 'CODE_TAKEN' );
		if ( error ) fail( error );
		return data as RoomRow;
	},
	async roomByCode( code ) {
		const { data, error } = await client.from( 'rooms' ).select().eq( 'code', code ).maybeSingle();
		if ( error ) fail( error );
		return data as RoomRow | null;
	},
	async roomById( id ) {
		const { data, error } = await client.from( 'rooms' ).select().eq( 'id', id ).maybeSingle();
		if ( error ) fail( error );
		return data as RoomRow | null;
	},
	async claimGuest( roomId, guest, guestName ) {
		const { data, error } = await client
			.from( 'rooms' )
			.update( { guest, guest_name: guestName } )
			.eq( 'id', roomId )
			.is( 'guest', null )
			.select( 'id' );
		if ( error ) fail( error );
		return ( data ?? [] ).length === 1;
	},
	async setRoomStatus( roomId, status ) {
		const { error } = await client.from( 'rooms' ).update( { status } ).eq( 'id', roomId );
		if ( error ) fail( error );
	},
	async insertGame( row ) {
		const { data, error } = await client.from( 'games' ).insert( row ).select().single();
		if ( error?.code === UNIQUE_VIOLATION ) throw new ServerError( 'STALE_VERSION' );
		if ( error ) fail( error );
		return data as GameRow;
	},
	async gameById( id ) {
		const { data, error } = await client.from( 'games' ).select().eq( 'id', id ).maybeSingle();
		if ( error ) fail( error );
		return data as GameRow | null;
	},
	async latestGame( roomId ) {
		const { data, error } = await client
			.from( 'games' )
			.select()
			.eq( 'room_id', roomId )
			.order( 'number', { ascending: false } )
			.limit( 1 )
			.maybeSingle();
		if ( error ) fail( error );
		return data as GameRow | null;
	},
	async applyMove( { gameId, seq, actor, kind, payload, snapshot, scores, crawfordPlayed } ) {
		const { error } = await client.rpc( 'apply_move', {
			p_game_id: gameId,
			p_seq: seq,
			p_actor: actor,
			p_kind: kind,
			p_payload: payload,
			p_snapshot: snapshot,
			p_scores: scores ?? null,
			p_crawford_played: crawfordPlayed ?? null,
		} );
		if ( error?.message.includes( 'stale_version' ) || error?.code === UNIQUE_VIOLATION ) {
			throw new ServerError( 'STALE_VERSION' );
		}
		if ( error ) fail( error );
	},
	async movesAfter( gameId, seq ) {
		const { data, error } = await client
			.from( 'moves' )
			.select( 'game_id, seq, actor, kind, payload' )
			.eq( 'game_id', gameId )
			.gt( 'seq', seq )
			.order( 'seq' );
		if ( error ) fail( error );
		return ( data ?? [] ) as MoveRow[];
	},
} );
