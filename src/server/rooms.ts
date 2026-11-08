/**
 * Creating and joining rooms. Host = Light (PLAYER_ONE), guest = Dark
 * (PLAYER_TWO). The server performs the opening roll, so neither client
 * chooses the dice.
 */
import { createGame, openingRoll } from '../engine/game';
import { hasEngine } from '../engine';
import {
	DEFAULT_OPTIONS,
	type VariantId,
	type VariantOptions,
} from '../engine/types';
import { rollDie, type Rng } from '../runtime/rng';
import { PlayerType } from '../types/PlayerType';
import { generateCode, normaliseCode } from './codes';
import type { Db, GameRow, RoomRow } from './db';
import { isMatchOver, type Scores } from '../data/sessionSlice';
import { cryptoRng } from './dice';
import { requireUser, ServerError } from './errors';

export type CreateRoomInput = {
	variant: VariantId;
	options: Partial< VariantOptions >;
	matchTarget: number;
	name: string;
};

export type JoinResult = {
	roomId: string;
	gameId: string;
	seat: typeof PlayerType.PLAYER_TWO;
};

const MAX_NAME = 24;

export const cleanName = ( name: unknown, fallback: string ): string => {
	const trimmed =
		typeof name === 'string' ? name.trim().slice( 0, MAX_NAME ) : '';
	return trimmed || fallback;
};

/** Keeps only known options with the right type; unknown keys are dropped. */
export const cleanOptions = ( options: unknown ): Partial< VariantOptions > => {
	const out: Partial< VariantOptions > = {};
	if ( ! options || typeof options !== 'object' ) return out;
	const given = options as Record< string, unknown >;
	for ( const key of Object.keys( DEFAULT_OPTIONS ) as Array<
		keyof VariantOptions
	> ) {
		const value = given[ key ];
		if ( value === undefined ) continue;
		const nullableCount =
			key === 'rerollLimit' || key === 'maxCheckersPerPoint';
		if ( nullableCount ) {
			if (
				value === null ||
				( Number.isInteger( value ) &&
					( value as number ) >= 0 &&
					( value as number ) <= 15 )
			) {
				( out as Record< string, unknown > )[ key ] = value;
			} else
				throw new ServerError( 'BAD_REQUEST', `Bad option ${ key }` );
		} else if ( typeof value === 'boolean' ) {
			( out as Record< string, unknown > )[ key ] = value;
		} else throw new ServerError( 'BAD_REQUEST', `Bad option ${ key }` );
	}
	return out;
};

export const createRoom = async (
	db: Db,
	userId: string | null,
	input: CreateRoomInput,
	rng: Rng = cryptoRng
): Promise< { code: string } > => {
	const host = requireUser( userId );
	if ( ! hasEngine( input.variant ) )
		throw new ServerError( 'UNKNOWN_VARIANT' );
	if (
		! Number.isInteger( input.matchTarget ) ||
		input.matchTarget < 1 ||
		input.matchTarget > 25
	) {
		throw new ServerError( 'BAD_REQUEST', 'Match length must be 1 to 25.' );
	}
	const options = cleanOptions( input.options );
	for ( let attempt = 0; attempt < 8; attempt++ ) {
		try {
			const room = await db.insertRoom( {
				code: generateCode( rng ),
				variant: input.variant,
				options,
				match_target: input.matchTarget,
				host,
				host_name: cleanName( input.name, 'Light' ),
			} );
			return { code: room.code };
		} catch ( error ) {
			if ( ! (
				error instanceof ServerError && error.code === 'CODE_TAKEN'
			) )
				throw error;
		}
	}
	throw new ServerError( 'SERVER_ERROR', 'No free room code.' );
};

/**
 * Game `number` with the opening roll, created once: a second caller (the
 * other player, or a repeated click) gets the same game.
 */
const openGame = async (
	db: Db,
	room: RoomRow,
	number: number,
	carried: { scores: Scores; crawfordPlayed: boolean },
	rng: Rng
): Promise< GameRow > => {
	const existing = await db.latestGame( room.id );
	// A game that exists without its opening roll (a crash in between) gets
	// the roll now instead of staying stuck in the opening.
	const unrolled =
		existing && existing.number === number && existing.version === 0;
	if ( existing && existing.number >= number && ! unrolled ) return existing;
	let game: GameRow;
	if ( unrolled ) game = existing;
	else
		try {
			game = await db.insertGame( {
				room_id: room.id,
				number,
				snapshot: createGame( room.variant, room.options ),
				scores: carried.scores,
				crawford_played: carried.crawfordPlayed,
			} );
		} catch ( error ) {
			const raced = await db.latestGame( room.id );
			if ( raced && raced.number >= number ) return raced;
			throw error;
		}
	let state = game.snapshot;
	const rolls: Array< [ number, number ] > = [];
	while ( state.phase === 'opening' && rolls.length < 100 ) {
		const pair: [ number, number ] = [ rollDie( rng ), rollDie( rng ) ];
		rolls.push( pair );
		state = openingRoll( state, pair[ 0 ], pair[ 1 ] );
	}
	await db.applyMove( {
		gameId: game.id,
		seq: 1,
		actor: null,
		kind: 'opening',
		payload: { rolls },
		snapshot: state,
	} );
	await db.setRoomStatus( room.id, 'playing' );
	return { ...game, snapshot: state, version: 1 };
};

const ZERO: Scores = {
	[ PlayerType.PLAYER_ONE ]: 0,
	[ PlayerType.PLAYER_TWO ]: 0,
};

export const joinRoom = async (
	db: Db,
	userId: string | null,
	input: { code: string; name: string },
	rng: Rng = cryptoRng
): Promise< JoinResult > => {
	const guest = requireUser( userId );
	const room = await db.roomByCode( normaliseCode( input.code ) );
	if ( ! room ) throw new ServerError( 'ROOM_NOT_FOUND' );
	if ( room.host === guest ) throw new ServerError( 'OWN_ROOM' );
	if ( room.guest !== guest ) {
		if ( room.guest !== null ) throw new ServerError( 'ROOM_FULL' );
		if (
			! ( await db.claimGuest(
				room.id,
				guest,
				cleanName( input.name, 'Dark' )
			) )
		) {
			throw new ServerError( 'ROOM_FULL' );
		}
	}
	const game = await openGame(
		db,
		room,
		1,
		{ scores: ZERO, crawfordPlayed: false },
		rng
	);
	return { roomId: room.id, gameId: game.id, seat: PlayerType.PLAYER_TWO };
};

export type RoomView = {
	roomId: string;
	code: string;
	variant: VariantId;
	matchTarget: number;
	hostName: string;
	guestName: string | null;
	status: RoomRow[ 'status' ];
	/** The visitor's seat in this room, or null for a visitor who has not joined. */
	role: 'host' | 'guest' | null;
	/** The current game, for the room's players only. */
	gameId: string | null;
};

/** What the room page needs to know about a room, from this visitor's side. */
export const describeRoom = async (
	db: Db,
	userId: string | null,
	code: string
): Promise< RoomView > => {
	const room = await db.roomByCode( normaliseCode( code ) );
	if ( ! room ) throw new ServerError( 'ROOM_NOT_FOUND' );
	let role: RoomView[ 'role' ] = null;
	if ( userId && userId === room.host ) role = 'host';
	else if ( userId && userId === room.guest ) role = 'guest';
	const game = role ? await db.latestGame( room.id ) : null;
	return {
		roomId: room.id,
		code: room.code,
		variant: room.variant,
		matchTarget: room.match_target,
		hostName: room.host_name,
		guestName: room.guest_name,
		status: room.status,
		role,
		gameId: game?.id ?? null,
	};
};

/**
 * The next game of the match once the current one is over: scores and the
 * Crawford state carry over; after the last game of a match a new match
 * starts from 0-0. `after` is the game the player saw end, so a second
 * request (the other player, a repeated click) returns the same new game.
 */
export const rematch = async (
	db: Db,
	userId: string | null,
	{ roomId, after }: { roomId: string; after?: number },
	rng: Rng = cryptoRng
): Promise< { gameId: string; number: number } > => {
	const user = requireUser( userId );
	const room = await db.roomById( roomId );
	if ( ! room ) throw new ServerError( 'ROOM_NOT_FOUND' );
	if ( user !== room.host && user !== room.guest )
		throw new ServerError( 'NOT_A_PLAYER' );
	const last = await db.latestGame( room.id );
	if ( ! last ) throw new ServerError( 'GAME_NOT_FOUND' );
	if ( after !== undefined && last.number > after )
		return { gameId: last.id, number: last.number };
	if ( last.snapshot.phase !== 'over' )
		throw new ServerError( 'GAME_NOT_OVER' );
	const newMatch = isMatchOver( last.scores, room.match_target );
	const carried = newMatch
		? { scores: ZERO, crawfordPlayed: false }
		: { scores: last.scores, crawfordPlayed: last.crawford_played };
	const game = await openGame( db, room, last.number + 1, carried, rng );
	return { gameId: game.id, number: game.number };
};
