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
			// Player 1 has all checkers in home board
			const allInHomeBoard = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 19 }, // Home board starts at lane 19
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 },
			];

			// Player 1 has one checker outside home board
			const oneOutsideHomeBoard = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 18 }, // Outside home board
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 },
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
			// From lane 24, die 6 is exact (24 - 6 = 18)
			expect(
				wouldClearOffChecker( {
					die: 6,
					lane: 24,
					currentPlayer: PlayerType.PLAYER_ONE,
					checkers: allInHomeBoard,
				} )
			).toBe( true );

			// wouldClearOffChecker should correctly reject bearing off from outside home board
			expect(
				wouldClearOffChecker( {
					die: 10,
					lane: 18,
					currentPlayer: PlayerType.PLAYER_ONE,
					checkers: oneOutsideHomeBoard,
				} )
			).toBe( false );
		} );

		it( 'should only allow bearing off when all checkers are in home board (Player 2)', () => {
			// Player 2 has all checkers in home board
			const allInHomeBoard = [
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 1 }, // Home board starts at lane 1
				{ id: 4, player: PlayerType.PLAYER_TWO, lane: 6 },
			];

			// Player 2 has one checker outside home board
			const oneOutsideHomeBoard = [
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 7 }, // Outside home board
				{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 },
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
			// From lane 3, die 4 is exact (3 + 4 = 7)
			expect(
				wouldClearOffChecker( {
					die: 4,
					lane: 3,
					currentPlayer: PlayerType.PLAYER_TWO,
					checkers: allInHomeBoard,
				} )
			).toBe( true );

			// wouldClearOffChecker should correctly reject bearing off from outside home board
			expect(
				wouldClearOffChecker( {
					die: 10,
					lane: 7,
					currentPlayer: PlayerType.PLAYER_TWO,
					checkers: oneOutsideHomeBoard,
				} )
			).toBe( false );
		} );

		it( 'should detect checkers outside home board prevents bearing off (Player 1)', () => {
			// Player 1 has one checker outside home board and one in home board
			const checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 18 }, // Outside home board
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 }, // In home board
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
				{ id: 1, player: PlayerType.PLAYER_TWO, lane: 7 }, // Outside home board
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 1 }, // In home board
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
					// Player 1 checkers
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 19 },
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 },
					{ id: 3, player: PlayerType.PLAYER_ONE, lane: 22 },

					// Player 2 checkers
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 3 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 6, player: PlayerType.PLAYER_TWO, lane: 7 }, // Outside home board
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 5 ],
			};

			// Player 1 has all checkers in home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: gameState.checkers,
					currentPlayer: PlayerType.PLAYER_ONE,
				} )
			).toBe( false );

			// Player 2 has one checker outside home board
			expect(
				hasCheckersOutsideHomeBoard( {
					checkers: gameState.checkers,
					currentPlayer: PlayerType.PLAYER_TWO,
				} )
			).toBe( true );

			// Player 1 can bear off from lane 22 with a die of 4 (exact: 22 - 4 = 18)
			expect(
				wouldClearOffChecker( {
					die: 4,
					lane: 22,
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
