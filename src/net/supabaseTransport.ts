/**
 * The Transport on Supabase: writes through the Server Actions (validated
 * on the server), reads and live updates through the browser client, which
 * row-level security limits to the player's own rooms.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ServerError } from '../server/errors';
import type { SubmitInput } from '../server/moves';
import type { Result } from '../server/result';
import type { CreateRoomInput, JoinResult } from '../server/rooms';
import type { LoggedMove } from './protocol';
import type { LoadedGame, Presence, Transport } from './transport';

export type RoomActions = {
	createRoom( input: CreateRoomInput ): Promise< Result< { code: string } > >;
	joinRoom( input: {
		code: string;
		name: string;
	} ): Promise< Result< JoinResult > >;
	submitMove( input: SubmitInput ): Promise< Result< { version: number } > >;
};

const unwrap = < T >( result: Result< T > ): T => {
	if ( ! result.ok ) throw new ServerError( result.code );
	return result.value;
};

const SUBSCRIBE_TIMEOUT = 10000;

export const createSupabaseTransport = (
	client: SupabaseClient,
	actions: RoomActions
): Transport => ( {
	createRoom: async ( input ) => unwrap( await actions.createRoom( input ) ),
	joinRoom: async ( code, name ) =>
		unwrap( await actions.joinRoom( { code, name } ) ),
	submit: async ( gameId, move ) =>
		unwrap( await actions.submitMove( { gameId, ...move } ) ),

	async loadGame( gameId ): Promise< LoadedGame > {
		const { data, error } = await client
			.from( 'games' )
			.select( 'snapshot, version, number, scores, room_id' )
			.eq( 'id', gameId )
			.maybeSingle();
		if ( error ) throw new ServerError( 'SERVER_ERROR', error.message );
		if ( ! data ) throw new ServerError( 'GAME_NOT_FOUND' );
		return {
			snapshot: data.snapshot,
			version: data.version,
			number: data.number,
			scores: data.scores,
			roomId: data.room_id,
		};
	},

	async movesAfter( gameId, seq ) {
		const { data, error } = await client
			.from( 'moves' )
			.select( 'seq, kind, payload' )
			.eq( 'game_id', gameId )
			.gt( 'seq', seq )
			.order( 'seq' );
		if ( error ) throw new ServerError( 'SERVER_ERROR', error.message );
		return ( data ?? [] ) as LoggedMove[];
	},

	async subscribe( gameId, onMove ) {
		// Row-level security filters live rows by the player's token, so the
		// realtime socket must carry it.
		const { data: session } = await client.auth.getSession();
		if ( session.session )
			await client.realtime.setAuth( session.session.access_token );
		const channel = client
			.channel(
				`moves:${ gameId }:${ Math.random().toString( 36 ).slice( 2 ) }`
			)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'moves',
					filter: `game_id=eq.${ gameId }`,
				},
				( change ) => {
					const row = change.new as LoggedMove;
					onMove( {
						seq: row.seq,
						kind: row.kind,
						payload: row.payload,
					} );
				}
			);
		const stop = () => void client.removeChannel( channel );
		return new Promise< () => void >( ( resolve, reject ) => {
			const timer = setTimeout( () => {
				stop();
				reject(
					new ServerError(
						'SERVER_ERROR',
						'Live updates did not start.'
					)
				);
			}, SUBSCRIBE_TIMEOUT );
			channel.subscribe( ( status ) => {
				if ( status === 'SUBSCRIBED' ) {
					clearTimeout( timer );
					resolve( stop );
				} else if (
					status === 'CHANNEL_ERROR' ||
					status === 'TIMED_OUT'
				) {
					clearTimeout( timer );
					stop();
					reject(
						new ServerError(
							'SERVER_ERROR',
							`Live updates failed: ${ status }`
						)
					);
				}
			} );
		} );
	},

	presence( roomId, me ): Presence {
		const channel = client.channel( `room:${ roomId }`, {
			config: { presence: { key: me } },
		} );
		const listeners = new Set< ( online: string[] ) => void >();
		channel.on( 'presence', { event: 'sync' }, () => {
			const online = Object.keys( channel.presenceState() );
			for ( const listener of listeners ) listener( online );
		} );
		channel.subscribe( ( status ) => {
			if ( status === 'SUBSCRIBED' )
				void channel.track( { since: Date.now() } );
		} );
		return {
			onChange( callback ) {
				listeners.add( callback );
				return () => listeners.delete( callback );
			},
			leave() {
				listeners.clear();
				void channel
					.untrack()
					.finally( () => client.removeChannel( channel ) );
			},
		};
	},
} );
