/**
 * An in-memory backend: the real server functions on the in-memory Db,
 * with new moves pushed to subscribers (in a later microtask, like
 * realtime). Each player gets a Transport bound to their user id.
 */
import type { LoggedMove } from '../../net/protocol';
import type { Transport } from '../../net/transport';
import { submitMove } from '../../server/moves';
import { createRoom, describeRoom, joinRoom, rematch } from '../../server/rooms';
import type { Rng } from '../../runtime/rng';
import { memoryDb } from '../server/memoryDb';

export const fakeNetwork = ( rng?: Rng ) => {
	const store = memoryDb();
	const { db } = store;
	const subscribers = new Map< string, Set< ( m: LoggedMove ) => void > >();
	const reconnectors = new Set< () => void >();
	/** While true, live delivery is broken (moves still reach the server). */
	const live = { drop: false };
	const applyMove = db.applyMove.bind( db );
	db.applyMove = async ( move ) => {
		await applyMove( move );
		const row: LoggedMove = { seq: move.seq, kind: move.kind, payload: structuredClone( move.payload ) };
		if ( live.drop ) return;
		queueMicrotask( () => subscribers.get( move.gameId )?.forEach( ( fn ) => fn( row ) ) );
	};

	const transportFor = (
		userId: string
	): Transport & { failNextSubmit(): void; holdAcks(): () => void; submits: number } => {
		let fail = false;
		let gate: Promise< void > | null = null;
		const transport: Transport & { failNextSubmit(): void; holdAcks(): () => void; submits: number } = {
			submits: 0,
			failNextSubmit() {
				fail = true;
			},
			/** Moves still reach the server, but the answer waits for the returned release. */
			holdAcks() {
				let release = () => {};
				gate = new Promise( ( resolve ) => {
					release = () => {
						gate = null;
						resolve();
					};
				} );
				return release;
			},
			// Room codes use their own randomness; the scripted rng is for dice.
			createRoom: ( input ) => createRoom( db, userId, input ),
			joinRoom: ( code, name ) => joinRoom( db, userId, { code, name }, rng ),
			describeRoom: ( code ) => describeRoom( db, userId, code ),
			rematch: ( roomId, after ) => rematch( db, userId, { roomId, after }, rng ),
			async submit( gameId: string, move: Parameters< Transport[ 'submit' ] >[ 1 ] ) {
				transport.submits++;
				if ( fail ) {
					fail = false;
					throw Object.assign( new Error( 'refused' ), { code: 'STALE_VERSION' } );
				}
				const result = await submitMove( db, userId, { gameId, ...move }, rng );
				if ( gate ) await gate;
				return result;
			},
			async loadGame( gameId ) {
				const game = ( await db.gameById( gameId ) )!;
				return { snapshot: game.snapshot, version: game.version, number: game.number, scores: game.scores, crawfordPlayed: game.crawford_played, roomId: game.room_id };
			},
			async movesAfter( gameId, seq ) {
				return ( await db.movesAfter( gameId, seq ) ).map( ( m ) => ( { seq: m.seq, kind: m.kind, payload: m.payload } ) );
			},
			async subscribe( gameId: string, onMove: ( m: LoggedMove ) => void, onReconnect?: () => void ) {
				const set = subscribers.get( gameId ) ?? new Set();
				set.add( onMove );
				subscribers.set( gameId, set );
				if ( onReconnect ) reconnectors.add( onReconnect );
				return () => {
					set.delete( onMove );
					if ( onReconnect ) reconnectors.delete( onReconnect );
				};
			},
			presence: () => ( { onChange: () => () => {}, leave: () => {} } ),
		};
		return transport;
	};

	/** Live delivery comes back: every subscriber is told to catch up. */
	const reconnect = () => {
		live.drop = false;
		reconnectors.forEach( ( fn ) => fn() );
	};

	return { ...store, transportFor, live, reconnect };
};
