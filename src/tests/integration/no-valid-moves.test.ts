/**
 * When a player rolls and has no playable dice sequence, the turn is
 * forfeited: a notice is shown, the player toggles, and dice auto-roll
 * for the opponent.
 */
import { describe, it, expect } from 'vitest';
import { PlayerType, MessageType } from '../../types';
import { checkAndHandleNoValidMoves } from '../../helpers/noValidMovesHelper';
import { createTestStore, makeCheckers } from './test-utils';

describe( 'No valid moves — turn handoff', () => {
	it( 'forfeits the turn when P1 is on the bar and both entry points are blocked', () => {
		// P1 has a bar checker; P2 blocks entry lanes 22 (die 3) and 20 (die 5).
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 0 },
			{ player: PlayerType.PLAYER_TWO, lane: 22 },
			{ player: PlayerType.PLAYER_TWO, lane: 22 },
			{ player: PlayerType.PLAYER_TWO, lane: 20 },
			{ player: PlayerType.PLAYER_TWO, lane: 20 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers,
		} );

		const passed = checkAndHandleNoValidMoves( {
			dispatch: store.dispatch,
			checkers: store.getState().checkers,
			dice: store.getState().dice,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( passed ).toBe( true );
		expect( store.getState().notice.message ).toBe(
			MessageType.NO_VALID_MOVES
		);
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_TWO );
		// Auto-roll for the opponent.
		expect( store.getState().dice.length ).toBeGreaterThan( 0 );
	} );

	it( 'does not forfeit when at least one die is playable', () => {
		// P1 bar checker; entry 5 → lane 20 is open.
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 0 },
			{ player: PlayerType.PLAYER_TWO, lane: 22 },
			{ player: PlayerType.PLAYER_TWO, lane: 22 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers,
		} );

		const passed = checkAndHandleNoValidMoves( {
			dispatch: store.dispatch,
			checkers,
			dice: [ 3, 5 ],
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( passed ).toBe( false );
		expect( store.getState().dice ).toEqual( [ 3, 5 ] );
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_ONE );
	} );

	it( 'no-op when dice array is empty', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [],
		} );

		const passed = checkAndHandleNoValidMoves( {
			dispatch: store.dispatch,
			checkers: store.getState().checkers,
			dice: [],
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( passed ).toBe( false );
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_ONE );
	} );
} );
