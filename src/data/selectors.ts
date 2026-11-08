/**
 * Selectors over the root state. Everything the UI shows is derived here;
 * nothing rule-related is computed in components.
 */
import { createSelector } from '@reduxjs/toolkit';
import { getEngine } from '../engine';
import type { EngineErrorCode } from '../engine/errors';
import type { GameState, Player, Step } from '../engine/types';
import { MessageType } from '../types/MessageType';
import { NoticeStatusType } from '../types/NoticeStatusType';
import type { NoticeType } from '../types/NoticeType';
import { PlayerType } from '../types/PlayerType';
import type { RootState } from './createStore';
import type { Seat } from './sessionSlice';
import { isCubeAllowed } from './sessionSlice';

export const selectGame = ( root: RootState ): GameState => root.game.state;

export const selectLegalSteps = createSelector(
	[ selectGame ],
	( game ): Step[] =>
		game.phase === 'moving' ? getEngine( game.variant ).legalSteps( game ) : []
);

/** Distinct die values with a legal step right now, larger first. */
export const selectPlayableDice = createSelector(
	[ selectLegalSteps ],
	( steps ): number[] =>
		[ ...new Set( steps.map( ( s ) => s.die ) ) ].sort( ( a, b ) => b - a )
);

export const selectPipCounts = createSelector(
	[ selectGame ],
	( game ): Record< Player, number > => {
		const engine = getEngine( game.variant );
		return {
			[ PlayerType.PLAYER_ONE ]: engine.pipCount( game, PlayerType.PLAYER_ONE ),
			[ PlayerType.PLAYER_TWO ]: engine.pipCount( game, PlayerType.PLAYER_TWO ),
		};
	}
);

export const selectSeatToAct = ( root: RootState ): Seat | null => {
	const player = root.game.state.player;
	return player === null ? null : root.session.players[ player ];
};

export const selectCubeAllowed = ( root: RootState ): boolean =>
	root.game.state.options.cube &&
	getEngine( root.game.state.variant ).supportsCube &&
	isCubeAllowed(
		root.session.scores,
		root.session.matchTarget,
		root.session.crawfordPlayed
	);

/** The player to act may offer the cube before rolling. */
export const selectCanDouble = ( root: RootState ): boolean => {
	const { phase, player, cube } = root.game.state;
	return (
		phase === 'awaiting-roll' &&
		player !== null &&
		! cube.offered &&
		( cube.owner === null || cube.owner === player ) &&
		selectCubeAllowed( root )
	);
};

/**
 * The driver waits for this human to press Roll (they could double first).
 * The Roll button shows exactly when this is true.
 */
export const selectAwaitsHumanRoll = ( root: RootState ): boolean =>
	selectSeatToAct( root )?.kind === 'human' && selectCanDouble( root );

const notice = ( message: MessageType, status: NoticeStatusType ): NoticeType => ( {
	message,
	status,
} );

const errorMessage = ( code: EngineErrorCode, game: GameState ): MessageType => {
	switch ( code ) {
		case 'WRONG_PHASE':
			return game.phase === 'over'
				? MessageType.GAME_OVER
				: MessageType.ROLL_DICE_FIRST;
		case 'NOT_YOUR_TURN':
			return MessageType.NOT_YOUR_CHECKER;
		case 'ILLEGAL_STEP':
			return MessageType.NO_MOVE_FOR_CHECKER;
		case 'NOTHING_TO_UNDO':
			return MessageType.NO_MOVES_TO_UNDO;
		case 'CUBE_NOT_ALLOWED':
			return MessageType.CUBE_NOT_ALLOWED;
		case 'INVALID_POSITION':
			return MessageType.INVALID_POSITION;
		case 'UNKNOWN_VARIANT':
			return MessageType.UNKNOWN_VARIANT;
	}
};

const resultMessage = ( game: GameState ): MessageType => {
	const result = game.result;
	if ( ! result || result.winner === null ) return MessageType.GAME_DRAWN;
	return result.winner === PlayerType.PLAYER_ONE
		? MessageType.PLAYER_ONE_WINS
		: MessageType.PLAYER_TWO_WINS;
};

const computeNotice = (
	game: GameState,
	lastError: EngineErrorCode | null,
	hint: NoticeType | null
): NoticeType => {
	if ( lastError ) {
		return notice( errorMessage( lastError, game ), NoticeStatusType.ERROR );
	}
	if ( hint ) return hint;
	if ( game.phase === 'over' ) {
		return notice( resultMessage( game ), NoticeStatusType.SUCCESS );
	}
	switch ( game.lastEvent ) {
		case 'forfeit':
			return notice( MessageType.TURN_FORFEITED, NoticeStatusType.INFO );
		case 'reroll':
			return notice( MessageType.ROLL_AGAIN, NoticeStatusType.INFO );
		case 'undo':
			return notice( MessageType.MOVE_UNDONE, NoticeStatusType.INFO );
		case 'hit':
			return notice( MessageType.MOVE_CHECKER_AND_HIT, NoticeStatusType.SUCCESS );
		case 'hand-off':
			return notice( MessageType.MOVE_CHECKER, NoticeStatusType.SUCCESS );
		default:
			break;
	}
	if ( game.phase === 'opening' ) {
		return notice( MessageType.WELCOME, NoticeStatusType.INFO );
	}
	if ( game.turnSteps.length > 0 ) {
		return notice( MessageType.MOVE_CHECKER, NoticeStatusType.SUCCESS );
	}
	return notice( MessageType.WELCOME, NoticeStatusType.INFO );
};

/** The one notice the UI shows: error, then hint, then what just happened. */
export const selectNotice = createSelector(
	[
		selectGame,
		( root: RootState ) => root.game.lastError,
		( root: RootState ) => root.ui.hint,
	],
	computeNotice
);
