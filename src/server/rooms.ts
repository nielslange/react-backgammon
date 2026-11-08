/**
 * Creating and joining rooms. Host = Light (PLAYER_ONE), guest = Dark
 * (PLAYER_TWO). The server performs the opening roll, so neither client
 * chooses the dice.
 */
import { createGame, openingRoll } from '../engine/game';
import { hasEngine } from '../engine';
import { DEFAULT_OPTIONS, type VariantId, type VariantOptions } from '../engine/types';
import { rollDie, type Rng } from '../runtime/rng';
import { PlayerType } from '../types/PlayerType';
import { generateCode, normaliseCode } from './codes';
import type { Db, GameRow, RoomRow } from './db';
import { cryptoRng } from './dice';
import { requireUser, ServerError } from './errors';

export type CreateRoomInput = {
	variant: VariantId;
	options: Partial< VariantOptions >;
	matchTarget: number;
	name: string;
};

export type JoinResult = { roomId: string; gameId: string; seat: typeof PlayerType.PLAYER_TWO };

const MAX_NAME = 24;

export const cleanName = ( name: unknown, fallback: string ): string => {
	const trimmed = typeof name === 'string' ? name.trim().slice( 0, MAX_NAME ) : '';
	return trimmed || fallback;
};

/** Keeps only known options with the right type; unknown keys are dropped. */
export const cleanOptions = ( options: unknown ): Partial< VariantOptions > => {
	const out: Partial< VariantOptions > = {};
	if ( ! options || typeof options !== 'object' ) return out;
	const given = options as Record< string, unknown >;
	for ( const key of Object.keys( DEFAULT_OPTIONS ) as Array< keyof VariantOptions > ) {
		const value = given[ key ];
		if ( value === undefined ) continue;
		const nullableCount = key === 'rerollLimit' || key === 'maxCheckersPerPoint';
		if ( nullableCount ) {
			if ( value === null || ( Number.isInteger( value ) && ( value as number ) >= 0 && ( value as number ) <= 15 ) ) {
				( out as Record< string, unknown > )[ key ] = value;
			} else throw new ServerError( 'BAD_REQUEST', `Bad option ${ key }` );
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
	if ( ! hasEngine( input.variant ) ) throw new ServerError( 'UNKNOWN_VARIANT' );
	if ( ! Number.isInteger( input.matchTarget ) || input.matchTarget < 1 || input.matchTarget > 25 ) {
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
			if ( ! ( error instanceof ServerError && error.code === 'CODE_TAKEN' ) ) throw error;
		}
	}
	throw new ServerError( 'SERVER_ERROR', 'No free room code.' );
};

/** Game 1 with the opening roll, created once; a second caller gets the same game. */
const startFirstGame = async ( db: Db, room: RoomRow, rng: Rng ): Promise< GameRow > => {
	const existing = await db.latestGame( room.id );
	if ( existing ) return existing;
	let game: GameRow;
	try {
		game = await db.insertGame( {
			room_id: room.id,
			number: 1,
			snapshot: createGame( room.variant, room.options ),
			scores: { [ PlayerType.PLAYER_ONE ]: 0, [ PlayerType.PLAYER_TWO ]: 0 },
			crawford_played: false,
		} );
	} catch ( error ) {
		const raced = await db.latestGame( room.id );
		if ( raced ) return raced;
		throw error;
	}
	let state = game.snapshot;
	const rolls: Array< [ number, number ] > = [];
	while ( state.phase === 'opening' && rolls.length < 100 ) {
		const pair: [ number, number ] = [ rollDie( rng ), rollDie( rng ) ];
		rolls.push( pair );
		state = openingRoll( state, pair[ 0 ], pair[ 1 ] );
	}
	await db.applyMove( { gameId: game.id, seq: 1, actor: null, kind: 'opening', payload: { rolls }, snapshot: state } );
	await db.setRoomStatus( room.id, 'playing' );
	return { ...game, snapshot: state, version: 1 };
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
		if ( ! ( await db.claimGuest( room.id, guest, cleanName( input.name, 'Dark' ) ) ) ) {
			throw new ServerError( 'ROOM_FULL' );
		}
	}
	const game = await startFirstGame( db, room, rng );
	return { roomId: room.id, gameId: game.id, seat: PlayerType.PLAYER_TWO };
};
