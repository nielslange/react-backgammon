/**
 * Validates and stores one move of an online game. The server rolls the
 * dice, takes steps only from the engine's legal steps, and checks that
 * the signed-in user is the player allowed to act.
 */
import { getEngine } from '../engine';
import { opponent } from '../engine/constants';
import type { Player, Step } from '../engine/types';
import { afterGame, isCubeAllowed, isMatchOver } from '../data/sessionSlice';
import { applyMove, type MoveKind } from '../net/protocol';
import { rollDice, type Rng } from '../runtime/rng';
import { PlayerType } from '../types/PlayerType';
import type { Db } from './db';
import { cryptoRng } from './dice';
import { requireUser, ServerError } from './errors';

export type ClientMoveKind = Exclude< MoveKind, 'opening' >;

export type SubmitInput = {
	gameId: string;
	kind: ClientMoveKind;
	payload: unknown;
	/** The version the client last saw; the move must follow it. */
	version: number;
};

const CLIENT_KINDS: ClientMoveKind[] = [
	'roll',
	'step',
	'undo',
	'resign',
	'double',
	'accept',
	'drop',
];

const requireTurn = ( condition: boolean ) => {
	if ( ! condition ) throw new ServerError( 'NOT_YOUR_TURN' );
};

/** The legal step the client means: matched by origin and die (and target, if given). */
const legalStepFor = ( legal: Step[], payload: unknown ): Step => {
	const wanted = ( payload as { step?: Partial< Step > } | null )?.step;
	const match =
		wanted &&
		typeof wanted.from === 'number' &&
		typeof wanted.die === 'number' &&
		legal.find(
			( s ) =>
				s.from === wanted.from &&
				s.die === wanted.die &&
				( wanted.to === undefined || s.to === wanted.to )
		);
	if ( ! match ) throw new ServerError( 'ILLEGAL_STEP' );
	return match;
};

export const submitMove = async (
	db: Db,
	userId: string | null,
	input: SubmitInput,
	rng: Rng = cryptoRng
): Promise< { version: number } > => {
	const user = requireUser( userId );
	if ( ! CLIENT_KINDS.includes( input.kind ) )
		throw new ServerError( 'BAD_REQUEST' );
	const game = await db.gameById( input.gameId );
	if ( ! game ) throw new ServerError( 'GAME_NOT_FOUND' );
	const room = await db.roomById( game.room_id );
	if ( ! room ) throw new ServerError( 'ROOM_NOT_FOUND' );
	let seat: Player;
	if ( user === room.host ) seat = PlayerType.PLAYER_ONE;
	else if ( user === room.guest ) seat = PlayerType.PLAYER_TWO;
	else throw new ServerError( 'NOT_A_PLAYER' );
	if ( input.version !== game.version )
		throw new ServerError( 'STALE_VERSION' );

	const state = game.snapshot;
	const myTurn = state.player === seat;
	let payload: unknown = {};
	switch ( input.kind ) {
		case 'roll':
			requireTurn( myTurn );
			payload = { roll: rollDice( rng ) };
			break;
		case 'step':
			requireTurn( myTurn );
			payload = {
				step: legalStepFor(
					getEngine( state.variant ).legalSteps( state ),
					input.payload
				),
			};
			break;
		case 'undo':
			requireTurn( myTurn );
			break;
		case 'resign':
			payload = { player: seat };
			break;
		case 'double':
			requireTurn( myTurn );
			if (
				! isCubeAllowed(
					game.scores,
					room.match_target,
					game.crawford_played
				)
			) {
				throw new ServerError( 'CUBE_NOT_ALLOWED' );
			}
			payload = { player: seat };
			break;
		case 'accept':
		case 'drop':
			requireTurn(
				state.cube.offered &&
					state.player !== null &&
					opponent( state.player ) === seat
			);
			break;
	}

	const next = applyMove( state, { kind: input.kind, payload } );
	let scores;
	let crawfordPlayed;
	if ( next.phase === 'over' && state.phase !== 'over' && next.result ) {
		( { scores, crawfordPlayed } = afterGame(
			game.scores,
			room.match_target,
			game.crawford_played,
			next.result.winner,
			next.result.points
		) );
	}
	const version = game.version + 1;
	await db.applyMove( {
		gameId: game.id,
		seq: version,
		actor: user,
		kind: input.kind,
		payload,
		snapshot: next,
		scores,
		crawfordPlayed,
	} );
	if ( scores && isMatchOver( scores, room.match_target ) )
		await db.setRoomStatus( room.id, 'finished' );
	return { version };
};
