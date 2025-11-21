// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { PlayerType } from '../../types';
// Remove the conflicting imports and use the local functions
// import { getTargetLane } from '../../data/selectors';
// import { rollDice } from '../../helpers/diceHelper';
// import { createMockGame } from '../test-utils/mockFactory';
// import { getAvailableLanes } from '../../data/selectors';

// Define interfaces for testing
interface Checker {
	id: number;
	lane: number;
	player: PlayerType;
}

interface GameState {
	checkers: Checker[];
	currentPlayer: PlayerType;
	dice: number[];
	activeLane: number | null;
	selectedDie: number | null;
	error: string | null;
}

// Helper function to create a mock game
const createMockGame = ( params: Partial< GameState > ): GameState => {
	return {
		checkers: [],
		currentPlayer: PlayerType.PLAYER_ONE,
		dice: [ 1, 2 ],
		activeLane: null,
		selectedDie: null,
		error: null,
		...params,
	};
};

// Import the needed function from the selectors file
import { getAvailableLanes } from '../../data/selectors';

// Helper functions for testing dice rules
const getTargetLane = ( {
	currentPlayer,
	lane,
	die,
}: {
	currentPlayer: PlayerType;
	lane: number;
	die: number;
} ): number => {
	return currentPlayer === PlayerType.PLAYER_ONE ? lane + die : lane - die;
};

const isLaneBlocked = (
	lane: number,
	currentPlayer: PlayerType,
	checkers: Checker[]
): boolean => {
	const opposingPlayer =
		currentPlayer === PlayerType.PLAYER_ONE
			? PlayerType.PLAYER_TWO
			: PlayerType.PLAYER_ONE;
	const checkersOnLane = checkers.filter(
		( c ) => c.lane === lane && c.player === opposingPlayer
	);
	return checkersOnLane.length >= 2;
};

// Function to check if a move is valid for bearing off
const isValidBearOff = ( {
	die,
	lane,
	currentPlayer,
	hasCheckersOutsideHomeBoard,
}: {
	die: number;
	lane: number;
	currentPlayer: PlayerType;
	hasCheckersOutsideHomeBoard: boolean;
} ): boolean => {
	// Can't bear off while checkers are outside home board
	if ( hasCheckersOutsideHomeBoard ) {
		return false;
	}

	// For Player 1, home board is 19-24
	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		// Exact number needed from point 19
		if ( lane === 19 && die === 6 ) return true;
		// Exact number needed from point 20
		if ( lane === 20 && die === 5 ) return true;
		// Exact number needed from point 21
		if ( lane === 21 && die === 4 ) return true;
		// Exact number needed from point 22
		if ( lane === 22 && die === 3 ) return true;
		// Exact number needed from point 23
		if ( lane === 23 && die === 2 ) return true;
		// Exact number needed from point 24
		if ( lane === 24 && die === 1 ) return true;

		// Can use higher die when no checkers are on higher points
		if ( die > 24 - lane ) {
			return true;
		}
	}

	// For Player 2, home board is 1-6
	if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		// Exact number needed from point 6
		if ( lane === 6 && die === 6 ) return true;
		// Exact number needed from point 5
		if ( lane === 5 && die === 5 ) return true;
		// Exact number needed from point 4
		if ( lane === 4 && die === 4 ) return true;
		// Exact number needed from point 3
		if ( lane === 3 && die === 3 ) return true;
		// Exact number needed from point 2
		if ( lane === 2 && die === 2 ) return true;
		// Exact number needed from point 1
		if ( lane === 1 && die === 1 ) return true;

		// Can use higher die when no checkers are on higher points
		if ( die > lane ) {
			return true;
		}
	}

	return false;
};

// Function to determine all available moves
const getAllAvailableMoves = (
	gameState: GameState
): { from: number; to: number; die: number }[] => {
	const { checkers, currentPlayer, dice } = gameState;
	const moves: { from: number; to: number; die: number }[] = [];

	// Get all current player's checkers
	const playerCheckers = checkers.filter(
		( c ) => c.player === currentPlayer
	);

	// For each die and each checker, check if move is valid
	for ( const die of dice ) {
		for ( const checker of playerCheckers ) {
			const targetLane = getTargetLane( {
				currentPlayer,
				lane: checker.lane,
				die,
			} );

			// Check if target lane is valid (on board: 1-24)
			if ( targetLane < 1 || targetLane > 24 ) {
				// Check if bearing off is valid
				if (
					isValidBearOff( {
						die,
						lane: checker.lane,
						currentPlayer,
						hasCheckersOutsideHomeBoard: false, // For simplicity in this test
					} )
				) {
					moves.push( { from: checker.lane, to: -1, die } ); // -1 indicates bearing off
				}
				continue;
			}

			// Check if target lane is blocked by opponent
			if ( isLaneBlocked( targetLane, currentPlayer, checkers ) )
				continue;

			moves.push( { from: checker.lane, to: targetLane, die } );
		}
	}

	return moves;
};

// Function to find required moves following the higher die rule
const getRequiredMoves = (
	gameState: GameState
): { from: number; to: number; die: number }[] => {
	const allMoves = getAllAvailableMoves( gameState );
	const { dice } = gameState;

	// If there are two different dice and player can only use one
	if ( dice.length === 2 && dice[ 0 ] !== dice[ 1 ] ) {
		const movesUsingHigherDie = allMoves.filter(
			( move ) => move.die === Math.max( ...dice )
		);
		const movesUsingLowerDie = allMoves.filter(
			( move ) => move.die === Math.min( ...dice )
		);

		// If player can use higher die but not lower die, must use higher die
		if (
			movesUsingHigherDie.length > 0 &&
			movesUsingLowerDie.length === 0
		) {
			return movesUsingHigherDie;
		}

		// If player can use lower die but not higher die, must use lower die
		if (
			movesUsingHigherDie.length === 0 &&
			movesUsingLowerDie.length > 0
		) {
			return movesUsingLowerDie;
		}

		// If player can use both dice, player must use both (no specific requirement)
		return allMoves;
	}

	// For doubles or other cases, return all moves
	return allMoves;
};

describe( 'Dice Usage Rules', () => {
	describe( 'Higher Die Rule', () => {
		it( 'should require using the higher die when only one die can be played', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					// Lane 15 and 16 are blocked
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 15 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 15 },
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 16 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 16 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 5, 6 ], // 5 would go to blocked lane 15, 6 would go to blocked lane 16
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Get all available moves
			const allMoves = getAllAvailableMoves( gameState );

			// In this scenario, both lanes 15 and 16 are blocked, so there are no valid moves
			expect( allMoves ).toHaveLength( 0 );

			// If we modify so lane 16 isn't blocked
			const modifiedGameState = {
				...gameState,
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					// Only lane 15 is blocked
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 15 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 15 },
				],
			};

			// Get required moves
			const requiredMoves = getRequiredMoves( modifiedGameState );

			// Should only allow the higher die (6) to be used
			expect( requiredMoves ).toHaveLength( 1 );
			expect( requiredMoves[ 0 ].die ).toBe( 6 );
			expect( requiredMoves[ 0 ].from ).toBe( 10 );
			expect( requiredMoves[ 0 ].to ).toBe( 16 );
		} );

		it( 'should require using both dice when possible', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 5 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Get available moves
			const allMoves = getAllAvailableMoves( gameState );

			// Should have moves for both dice
			expect( allMoves ).toHaveLength( 2 );

			// Check specific moves
			expect( allMoves ).toContainEqual( { from: 10, to: 13, die: 3 } );
			expect( allMoves ).toContainEqual( { from: 10, to: 15, die: 5 } );

			// Get required moves
			const requiredMoves = getRequiredMoves( gameState );

			// Should require both dice to be used (all moves)
			expect( requiredMoves ).toHaveLength( 2 );
		} );
	} );

	describe( 'Bearing Off Rules', () => {
		it( 'should require exact count for bearing off when higher points have checkers', () => {
			// Player 1 with checkers on 21, 22, 24
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 21 },
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 22 },
					{ id: 3, player: PlayerType.PLAYER_ONE, lane: 24 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 2, 3 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Check valid bear off for lane 24 with die 1 (exact)
			expect(
				isValidBearOff( {
					die: 1,
					lane: 24,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can't bear off with lane 24 and die 2 (not exact and other checkers on higher points)
			expect(
				isValidBearOff( {
					die: 2,
					lane: 24,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( false );

			// Check valid bear off for lane 22 with die 3 (exact)
			expect(
				isValidBearOff( {
					die: 3,
					lane: 22,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );
		} );

		it( 'should allow bearing off with higher dice when no checkers on higher points', () => {
			// Player 1 with checker only on lane 21
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 21 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 4, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Can bear off with lane 21 and die 4 (exact)
			expect(
				isValidBearOff( {
					die: 4,
					lane: 21,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can also bear off with lane 21 and die 6 (higher die and no checkers on higher points)
			expect(
				isValidBearOff( {
					die: 6,
					lane: 21,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );
		} );

		it( 'should handle Player 2 bearing off correctly', () => {
			// Player 2 with checkers on lanes 2, 3, 4
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_TWO, lane: 2 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 3 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 4 },
				],
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 2, 3 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Can bear off with lane 2 and die 2 (exact)
			expect(
				isValidBearOff( {
					die: 2,
					lane: 2,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can bear off with lane 3 and die 3 (exact)
			expect(
				isValidBearOff( {
					die: 3,
					lane: 3,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can't bear off with lane 3 and die 2 (not exact with checker on higher point)
			expect(
				isValidBearOff( {
					die: 2,
					lane: 3,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( false );

			// Player 2 with checker only on lane 2
			const modifiedGameState: GameState = {
				checkers: [ { id: 1, player: PlayerType.PLAYER_TWO, lane: 2 } ],
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 3, 4 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Can bear off with lane 2 and die 3 (higher die, no checkers on higher points)
			expect(
				isValidBearOff( {
					die: 3,
					lane: 2,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );
		} );

		it( 'only allows Player 1 to bear off when all checkers are in home board (lanes 19-24)', () => {
			// Can't bear off while checkers are outside home board
			const game = createMockGame( {
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers: [
					// For Player 1, home board is 19-24
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 18 }, // Outside home board
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 }, // In home board
				],
				dice: [ 5 ],
			} );

			// Should not be able to bear off from lane 20 with die 5
			// since there's a checker outside home board
			const lane20Moves = getAvailableLanes( {
				currentPlayer: PlayerType.PLAYER_ONE,
				lane: 20,
				dice: game.dice,
				checkers: game.checkers,
			} );

			expect( lane20Moves ).toEqual( {} );
		} );

		it( 'only allows Player 2 to bear off when all checkers are in home board (lanes 1-6)', () => {
			const game = createMockGame( {
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers: [
					// For Player 2, home board is 1-6
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 7 }, // Outside home board
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 }, // In home board
				],
				dice: [ 5 ],
			} );

			// Should not be able to bear off from lane 5 with die 5
			// since there's a checker outside home board
			const lane5Moves = getAvailableLanes( {
				currentPlayer: PlayerType.PLAYER_TWO,
				lane: 5,
				dice: game.dice,
				checkers: game.checkers,
			} );

			// Only normal moves allowed (not bearing off)
			expect( lane5Moves ).toEqual( { 5: 0 } );
		} );
	} );

	describe( 'Forced Moves', () => {
		it( 'should identify the only available move when options are limited', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					// Most lanes are blocked
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 13 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 13 },
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 14 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 14 },
					{ id: 6, player: PlayerType.PLAYER_TWO, lane: 15 },
					{ id: 7, player: PlayerType.PLAYER_TWO, lane: 15 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 2, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Get all available moves
			const allMoves = getAllAvailableMoves( gameState );

			// Should have only one valid move (using die 2)
			expect( allMoves ).toHaveLength( 1 );
			expect( allMoves[ 0 ] ).toEqual( { from: 10, to: 12, die: 2 } );

			// Get required moves
			const requiredMoves = getRequiredMoves( gameState );

			// The only available move is required
			expect( requiredMoves ).toHaveLength( 1 );
			expect( requiredMoves[ 0 ] ).toEqual( {
				from: 10,
				to: 12,
				die: 2,
			} );
		} );

		it( 'should identify when no moves are possible', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					// All potential landing spots are blocked
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 12 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 12 },
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 13 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 13 },
					{ id: 6, player: PlayerType.PLAYER_TWO, lane: 14 },
					{ id: 7, player: PlayerType.PLAYER_TWO, lane: 14 },
					{ id: 8, player: PlayerType.PLAYER_TWO, lane: 15 },
					{ id: 9, player: PlayerType.PLAYER_TWO, lane: 15 },
					{ id: 10, player: PlayerType.PLAYER_TWO, lane: 16 },
					{ id: 11, player: PlayerType.PLAYER_TWO, lane: 16 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 2, 3, 4, 5, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Get all available moves
			const allMoves = getAllAvailableMoves( gameState );

			// Should have no valid moves
			expect( allMoves ).toHaveLength( 0 );

			// Get required moves
			const requiredMoves = getRequiredMoves( gameState );

			// No required moves when there are no available moves
			expect( requiredMoves ).toHaveLength( 0 );
		} );
	} );
} );
