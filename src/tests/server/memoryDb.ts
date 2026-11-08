/** An in-memory Db with the same rules as the Postgres schema, for tests. */
import type { Db, GameRow, MoveRow, RoomRow } from '../../server/db';
import { ServerError } from '../../server/errors';

export const memoryDb = () => {
	const rooms: RoomRow[] = [];
	const games: GameRow[] = [];
	const moves: MoveRow[] = [];
	let ids = 0;
	const id = () => `id-${ ++ids }`;
	const clone = < T >( v: T ): T => structuredClone( v );

	const db: Db = {
		async insertRoom( row ) {
			if ( rooms.some( ( r ) => r.code === row.code ) ) throw new ServerError( 'CODE_TAKEN' );
			const room: RoomRow = { ...row, id: id(), guest: null, guest_name: null, status: 'waiting' };
			rooms.push( room );
			return clone( room );
		},
		async roomByCode( code ) {
			const room = rooms.find( ( r ) => r.code === code );
			return room ? clone( room ) : null;
		},
		async roomById( roomId ) {
			const room = rooms.find( ( r ) => r.id === roomId );
			return room ? clone( room ) : null;
		},
		async claimGuest( roomId, guest, guestName ) {
			const room = rooms.find( ( r ) => r.id === roomId );
			if ( ! room || room.guest !== null ) return false;
			room.guest = guest;
			room.guest_name = guestName;
			return true;
		},
		async setRoomStatus( roomId, status ) {
			const room = rooms.find( ( r ) => r.id === roomId );
			if ( room ) room.status = status;
		},
		async insertGame( row ) {
			if ( games.some( ( g ) => g.room_id === row.room_id && g.number === row.number ) ) {
				throw new ServerError( 'STALE_VERSION' );
			}
			const game: GameRow = { ...clone( row ), id: id(), version: 0 };
			games.push( game );
			return clone( game );
		},
		async gameById( gameId ) {
			const game = games.find( ( g ) => g.id === gameId );
			return game ? clone( game ) : null;
		},
		async latestGame( roomId ) {
			const mine = games.filter( ( g ) => g.room_id === roomId ).sort( ( a, b ) => b.number - a.number );
			return mine[ 0 ] ? clone( mine[ 0 ] ) : null;
		},
		async applyMove( { gameId, seq, actor, kind, payload, snapshot, scores, crawfordPlayed } ) {
			const game = games.find( ( g ) => g.id === gameId );
			if ( ! game || game.version !== seq - 1 ) throw new ServerError( 'STALE_VERSION' );
			game.version = seq;
			game.snapshot = clone( snapshot );
			if ( scores ) game.scores = clone( scores );
			if ( crawfordPlayed !== undefined ) game.crawford_played = crawfordPlayed;
			moves.push( { game_id: gameId, seq, actor, kind, payload: clone( payload ) } );
		},
		async movesAfter( gameId, seq ) {
			return clone( moves.filter( ( m ) => m.game_id === gameId && m.seq > seq ).sort( ( a, b ) => a.seq - b.seq ) );
		},
	};
	return { db, rooms, games, moves };
};
