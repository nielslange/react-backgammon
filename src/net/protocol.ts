/**
 * The online move log. Every row turns one GameState into the next with
 * the engine; the server validates and stores it, and every browser
 * replays the same rows, so all copies of a game agree. Pure: no React,
 * no Supabase.
 */
import {
	acceptDouble,
	dropDouble,
	offerDouble,
	openingRoll,
	play,
	resign,
	roll,
	undoStep,
} from '../engine/game';
import type { GameState, Player, Roll, Step } from '../engine/types';

export type MoveKind =
	| 'opening'
	| 'roll'
	| 'step'
	| 'undo'
	| 'resign'
	| 'double'
	| 'accept'
	| 'drop';

export type LoggedMove = { seq: number; kind: MoveKind; payload: unknown };

type Payloads = {
	opening: { rolls: Array< [ number, number ] > };
	roll: { roll: Roll };
	step: { step: Step };
	resign: { player: Player };
	double: { player: Player };
};

/** Applies one logged move. Throws the engine's error if it does not apply. */
export const applyMove = (
	state: GameState,
	{ kind, payload }: Pick< LoggedMove, 'kind' | 'payload' >
): GameState => {
	switch ( kind ) {
		case 'opening':
			return ( payload as Payloads[ 'opening' ] ).rolls.reduce(
				( s, [ a, b ] ) => openingRoll( s, a, b ),
				state
			);
		case 'roll':
			return roll( state, ( payload as Payloads[ 'roll' ] ).roll );
		case 'step':
			return play( state, ( payload as Payloads[ 'step' ] ).step );
		case 'undo':
			return undoStep( state );
		case 'resign':
			return resign( state, ( payload as Payloads[ 'resign' ] ).player );
		case 'double':
			return offerDouble(
				state,
				( payload as Payloads[ 'double' ] ).player
			);
		case 'accept':
			return acceptDouble( state );
		case 'drop':
			return dropDouble( state );
	}
};

/** Replays moves in sequence order (the log may arrive out of order). */
export const replay = ( initial: GameState, moves: LoggedMove[] ): GameState =>
	[ ...moves ].sort( ( a, b ) => a.seq - b.seq ).reduce( applyMove, initial );
