// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
	hasCheckersOutsideHomeBoard,
	hasWaitingChecker,
	wouldClearOffChecker,
} from '../../data/selectors';
import { PlayerType } from '../../types';

// Use the same Checker interface as in selectors.ts
interface Checker {
	id: number;
	lane: number;
	player: PlayerType;
}

describe( 'Game Logic Integration Tests', () => {
	describe( 'Waiting Checker Logic', () => {
		it( 'should correctly identify when Player 1 has a waiting checker', () => {
			const checkers: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 }, // Waiting checker on bar
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 5 },
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 10 },
			];

			expect(
				hasWaitingChecker( {
					checkers,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( true );
		} );

		it( 'should correctly identify when Player 1 has no waiting checker', () => {
			const checkers: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 5 },
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 0 }, // Player 2 has a waiting checker, not Player 1
			];

			expect(
				hasWaitingChecker( {
					checkers,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( false );
		} );
	} );

	describe( 'Bearing Off Logic', () => {
		it( 'should only allow bearing off when all checkers are in home board (Player 1)', () => {
			// Player 1 has all checkers in home board (home board is lanes 1-6)
			const allInHomeBoard = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 1 }, // Home board is lanes 1-6
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 6 },
			];

			// Player 1 has one checker outside home board
			const oneOutsideHomeBoard = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 7 }, // Outside home board
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 },
			];

			// hasCheckersOutsideHomeBoard should be false when all checkers are in home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: allInHomeBoard,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( false );

			// hasCheckersOutsideHomeBoard should be true when a checker is outside home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: oneOutsideHomeBoard,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( true );

			// wouldClearOffChecker should correctly identify bearing off moves from home board
			// From lane 6, die 6 is exact (6 - 6 = 0)
			expect(
				wouldClearOffChecker( {
					die: 6,
					lane: 6,
					currentPlayer: PlayerType.PLAYER_ONE,
					checkers: allInHomeBoard,
				} )
			).toBe( true );

			// wouldClearOffChecker should correctly reject bearing off from outside home board
			expect(
				wouldClearOffChecker( {
					die: 10,
					lane: 7,
					currentPlayer: PlayerType.PLAYER_ONE,
					checkers: oneOutsideHomeBoard,
				} )
			).toBe( false );
		} );

		it( 'should only allow bearing off when all checkers are in home board (Player 2)', () => {
			// Player 2 has all checkers in home board (home board is lanes 19-24)
			const allInHomeBoard = [
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 19 }, // Home board is lanes 19-24
				{ id: 4, player: PlayerType.PLAYER_TWO, lane: 24 },
			];

			// Player 2 has one checker outside home board
			const oneOutsideHomeBoard = [
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 18 }, // Outside home board
				{ id: 4, player: PlayerType.PLAYER_TWO, lane: 20 },
			];

			// hasCheckersOutsideHomeBoard should be false when all checkers are in home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: allInHomeBoard,
					currentPlayer: PlayerType.PLAYER_TWO,
				} )
			).toBe( false );

			// hasCheckersOutsideHomeBoard should be true when a checker is outside home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: oneOutsideHomeBoard,
					currentPlayer: PlayerType.PLAYER_TWO,
				} )
			).toBe( true );

			// wouldClearOffChecker should correctly identify bearing off moves from home board
			// From lane 20, die 5 is exact (20 + 5 = 25)
			expect(
				wouldClearOffChecker( {
					die: 5,
					lane: 20,
					currentPlayer: PlayerType.PLAYER_TWO,
					checkers: allInHomeBoard,
				} )
			).toBe( true );

			// wouldClearOffChecker should correctly reject bearing off from outside home board
			expect(
				wouldClearOffChecker( {
					die: 10,
					lane: 18,
					currentPlayer: PlayerType.PLAYER_TWO,
					checkers: oneOutsideHomeBoard,
				} )
			).toBe( false );
		} );

		it( 'should detect checkers outside home board prevents bearing off (Player 1)', () => {
			// Player 1 has one checker outside home board and one in home board
			const checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 7 }, // Outside home board (home board is 1-6)
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 }, // In home board
			];

			// Should detect that checkers are outside home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( true );

			// The actual prevention of bearing off when checkers are outside
			// is handled in handleClickHelper by checking targetLane === 25
			// This test just verifies the detection logic works
		} );

		it( 'should detect checkers outside home board prevents bearing off (Player 2)', () => {
			// Player 2 has one checker outside home board and one in home board
			const checkers = [
				{ id: 1, player: PlayerType.PLAYER_TWO, lane: 18 }, // Outside home board (home board is 19-24)
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 20 }, // In home board
			];

			// Should detect that checkers are outside home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers,
					currentPlayer: PlayerType.PLAYER_TWO,
				} )
			).toBe( true );

			// The actual prevention of bearing off when checkers are outside
			// is handled in handleClickHelper by checking targetLane === 0
			// This test just verifies the detection logic works
		} );
	} );

	describe( 'Combined Game Logic', () => {
		it( 'should handle a realistic game state correctly', () => {
			// Set up a realistic game state
			const gameState = {
				checkers: [
					// Player 1 checkers (home board is 1-6)
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 1 },
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 },
					{ id: 3, player: PlayerType.PLAYER_ONE, lane: 5 },

					// Player 2 checkers (home board is 19-24)
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 20 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 22 },
					{ id: 6, player: PlayerType.PLAYER_TWO, lane: 18 }, // Outside home board
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 5 ],
			};

			// Player 1 has all checkers in home board (home board is 1-6)
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: gameState.checkers,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( false );

			// Player 2 has one checker outside home board (home board is 19-24)
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: gameState.checkers,
					currentPlayer: PlayerType.PLAYER_TWO,
				} )
			).toBe( true );

			// Player 1 can bear off from lane 3 with a die of 3 (exact: 3 - 3 = 0)
			expect(
				wouldClearOffChecker( {
					die: 3,
					lane: 3,
					currentPlayer: PlayerType.PLAYER_ONE,
					checkers: gameState.checkers,
				} )
			).toBe( true );

			// No waiting checkers for either player
			expect(
				hasWaitingChecker( {
					checkers: gameState.checkers,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( false );

			expect(
				hasWaitingChecker( {
					checkers: gameState.checkers,
					currentPlayer: PlayerType.PLAYER_TWO,
				} )
			).toBe( false );
		} );
	} );
} );
