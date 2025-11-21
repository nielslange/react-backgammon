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
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 21 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 },
		];

		const result = wouldClearOffChecker( {
			die: 5,
			lane: 21,
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
		} );

		expect( result ).toBe( true );

		const result2 = wouldClearOffChecker( {
			die: 6,
			lane: 20,
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
		} );

		expect( result2 ).toBe( true );
	} );

	it( 'should return false when Player 1 tries to bear off from outside home board', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 15 },
		];

		const result = wouldClearOffChecker( {
			die: 10,
			lane: 15,
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
		} );

		expect( result ).toBe( false );
	} );

	it( 'should return true when Player 2 move would bear off from home board', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 4 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 5 },
		];

		const result = wouldClearOffChecker( {
			die: 4,
			lane: 4,
			currentPlayer: PlayerType.PLAYER_TWO,
			checkers,
		} );

		expect( result ).toBe( true );

		const result2 = wouldClearOffChecker( {
			die: 6,
			lane: 5,
			currentPlayer: PlayerType.PLAYER_TWO,
			checkers,
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

	it( 'should allow exact bearing off for Player 1', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 24 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 22 },
		];

		// Exact match: lane 24 with die 1
		expect(
			wouldClearOffChecker( {
				die: 1,
				lane: 24,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );

		// Exact match: lane 22 with die 3
		expect(
			wouldClearOffChecker( {
				die: 3,
				lane: 22,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );
	} );

	it( 'should prevent bearing off with higher die when checkers exist on higher points (Player 1)', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 24 }, // Higher point
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 }, // Lower point
		];

		// Cannot bear off from lane 20 with die 3 (overshoot) when checker exists on lane 24
		expect(
			wouldClearOffChecker( {
				die: 3,
				lane: 20,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( false );

		// Can bear off from lane 24 with die 1 (exact match)
		expect(
			wouldClearOffChecker( {
				die: 1,
				lane: 24,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );
	} );

	it( 'should allow bearing off with higher die when no checkers on higher points (Player 1)', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 20 }, // Only checker, no higher points
		];

		// Can bear off from lane 20 with die 3 (overshoot) when no checkers on higher points
		expect(
			wouldClearOffChecker( {
				die: 3,
				lane: 20,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );

		// Can also bear off with die 5 (higher overshoot)
		expect(
			wouldClearOffChecker( {
				die: 5,
				lane: 20,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );
	} );

	it( 'should prevent bearing off with higher die when checkers exist on higher points (Player 2)', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 1 }, // Higher point (closer to 1)
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 4 }, // Lower point (closer to 6)
		];

		// Cannot bear off from lane 4 with die 3 (overshoot) when checker exists on lane 1
		expect(
			wouldClearOffChecker( {
				die: 3,
				lane: 4,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers,
			} )
		).toBe( false );

		// Can bear off from lane 1 with die 1 (exact match)
		expect(
			wouldClearOffChecker( {
				die: 1,
				lane: 1,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers,
			} )
		).toBe( true );
	} );

	it( 'should allow bearing off with higher die when no checkers on higher points (Player 2)', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 4 }, // Only checker, no higher points
		];

		// Can bear off from lane 4 with die 3 (overshoot) when no checkers on higher points
		expect(
			wouldClearOffChecker( {
				die: 3,
				lane: 4,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers,
			} )
		).toBe( true );

		// Can also bear off with die 5 (higher overshoot)
		expect(
			wouldClearOffChecker( {
				die: 5,
				lane: 4,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers,
			} )
		).toBe( true );
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
