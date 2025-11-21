import { describe, it, expect } from 'vitest';
import {
	hasWaitingChecker,
	hasCheckersOutsideHomeBoard,
	wouldClearOffChecker,
	isCheckerOnTheBoard,
	validateDiceUse,
} from '../../data/selectors';
import { PlayerType } from '../../types';

describe( 'hasWaitingChecker', () => {
	it( 'should return true when Player 1 has a checker on lane 0', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 5 },
		];

		const result = hasWaitingChecker( {
			checkers,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );
		expect( result ).toBe( true );
	} );

	it( 'should return false when Player 1 has no checker on lane 0', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 5 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 10 },
		];

		const result = hasWaitingChecker( {
			checkers,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );
		expect( result ).toBe( false );
	} );

	it( 'should return true when Player 2 has a checker on lane 25', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 25 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 5 },
		];

		const result = hasWaitingChecker( {
			checkers,
			currentPlayer: PlayerType.PLAYER_TWO,
		} );
		expect( result ).toBe( true );
	} );

	it( 'should return false when Player 2 has no checker on lane 25', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 5 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 10 },
		];

		const result = hasWaitingChecker( {
			checkers,
			currentPlayer: PlayerType.PLAYER_TWO,
		} );
		expect( result ).toBe( false );
	} );
} );

describe( 'hasCheckersOutsideHomeBoard', () => {
	it( 'should return true when Player 1 has checkers outside home board', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 18 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 },
		];

		const result = hasCheckersOutsideHomeBoard( {
			checkers,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( result ).toBe( true );
	} );

	it( 'should return false when Player 1 has all checkers in home board', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 19 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 },
		];

		const result = hasCheckersOutsideHomeBoard( {
			checkers,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( result ).toBe( false );
	} );

	it( 'should return true when Player 2 has checkers outside home board', () => {
		const checkers = [
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 7 },
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 },
		];

		const result = hasCheckersOutsideHomeBoard( {
			checkers,
			currentPlayer: PlayerType.PLAYER_TWO,
		} );

		expect( result ).toBe( true );
	} );

	it( 'should return false when Player 2 has all checkers in home board', () => {
		const checkers = [
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 6 },
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 },
		];

		const result = hasCheckersOutsideHomeBoard( {
			checkers,
			currentPlayer: PlayerType.PLAYER_TWO,
		} );

		expect( result ).toBe( false );
	} );
} );

describe( 'wouldClearOffChecker', () => {
	it( 'should return true when Player 1 move would bear off from home board', () => {
		const result = wouldClearOffChecker( {
			die: 5,
			lane: 21,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( result ).toBe( true );

		const result2 = wouldClearOffChecker( {
			die: 6,
			lane: 20,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( result2 ).toBe( true );
	} );

	it( 'should return false when Player 1 tries to bear off from outside home board', () => {
		const result = wouldClearOffChecker( {
			die: 10,
			lane: 15,
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		expect( result ).toBe( false );
	} );

	it( 'should return true when Player 2 move would bear off from home board', () => {
		const result = wouldClearOffChecker( {
			die: 4,
			lane: 4,
			currentPlayer: PlayerType.PLAYER_TWO,
		} );

		expect( result ).toBe( true );

		const result2 = wouldClearOffChecker( {
			die: 6,
			lane: 5,
			currentPlayer: PlayerType.PLAYER_TWO,
		} );

		expect( result2 ).toBe( true );
	} );

	it( 'should return false when Player 2 tries to bear off from outside home board', () => {
		const result = wouldClearOffChecker( {
			die: 10,
			lane: 10,
			currentPlayer: PlayerType.PLAYER_TWO,
		} );

		expect( result ).toBe( false );
	} );
} );

describe( 'isCheckerOnTheBoard', () => {
	it( 'should return true for lanes 1-24', () => {
		for ( let lane = 1; lane <= 24; lane++ ) {
			expect( isCheckerOnTheBoard( { lane } ) ).toBe( true );
		}
	} );

	it( 'should return false for lane 0 (bar for Player 1)', () => {
		expect( isCheckerOnTheBoard( { lane: 0 } ) ).toBe( false );
	} );

	it( 'should return false for lane 25 (bar for Player 2)', () => {
		expect( isCheckerOnTheBoard( { lane: 25 } ) ).toBe( false );
	} );
} );
