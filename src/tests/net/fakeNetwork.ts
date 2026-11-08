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
	const applyMove = db.applyMove.bind( db );
	db.applyMove = async ( move ) => {
		await applyMove( move );
		const row: LoggedMove = { seq: move.seq, kind: move.kind, payload: structuredClone( move.payload ) };
		queueMicrotask( () => subscribers.get( move.gameId )?.forEach( ( fn ) => fn( row ) ) );
	};

	const transportFor = ( userId: string ): Transport & { failNextSubmit(): void } => {
		let fail = false;
		return {
			failNextSubmit() {
				fail = true;
			},
			// Room codes use their own randomness; the scripted rng is for dice.
			createRoom: ( input ) => createRoom( db, userId, input ),
			joinRoom: ( code, name ) => joinRoom( db, userId, { code, name }, rng ),
			describeRoom: ( code ) => describeRoom( db, userId, code ),
			rematch: ( roomId, after ) => rematch( db, userId, { roomId, after }, rng ),
			async submit( gameId, move ) {
				if ( fail ) {
					fail = false;
					throw Object.assign( new Error( 'refused' ), { code: 'STALE_VERSION' } );
				}
				return submitMove( db, userId, { gameId, ...move }, rng );
			},
			async loadGame( gameId ) {
				const game = ( await db.gameById( gameId ) )!;
				return { snapshot: game.snapshot, version: game.version, number: game.number, scores: game.scores, crawfordPlayed: game.crawford_played, roomId: game.room_id };
			},
			async movesAfter( gameId, seq ) {
				return ( await db.movesAfter( gameId, seq ) ).map( ( m ) => ( { seq: m.seq, kind: m.kind, payload: m.payload } ) );
			},
			async subscribe( gameId, onMove ) {
				const set = subscribers.get( gameId ) ?? new Set();
				set.add( onMove );
				subscribers.set( gameId, set );
				return () => set.delete( onMove );
			},
			presence: () => ( { onChange: () => () => {}, leave: () => {} } ),
		};
	};

	return { ...store, transportFor };
};
