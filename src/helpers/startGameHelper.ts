/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { rollOpeningDie } from '../data/actions';
import { checkAndHandleNoValidMoves } from './noValidMovesHelper';
import { PlayerType } from '../types';
import type { StateType } from '../types';

const randomDie = () => Math.floor( Math.random() * 6 ) + 1;

/**
 * Opening roll: each player rolls one die, the higher roller moves first
 * using both dice as their first roll. Ties are re-rolled.
 *
 * @param dispatch  Redux dispatch.
 * @param getState  Returns the current store state.
 * @param rollDie   Die generator, injectable for deterministic tests.
 */
export const startGame = ( {
	dispatch,
	getState,
	rollDie = randomDie,
}: {
	dispatch: Dispatch;
	getState: () => StateType;
	rollDie?: () => number;
} ): void => {
	// Ties re-roll; the guard only protects against a pathological generator.
	let guard = 0;
	while ( getState().currentPlayer === null && guard++ < 100 ) {
		dispatch( rollOpeningDie( PlayerType.PLAYER_ONE, rollDie() ) );
		dispatch( rollOpeningDie( PlayerType.PLAYER_TWO, rollDie() ) );
	}

	const state = getState();
	if ( state.currentPlayer === null ) return;

	checkAndHandleNoValidMoves( {
		dispatch,
		checkers: state.checkers,
		dice: state.dice,
		currentPlayer: state.currentPlayer,
	} );
};
