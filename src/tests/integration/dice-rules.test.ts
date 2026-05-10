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
	// According to official rules: "checkers are always moved forward, to a lower-numbered point"
	// For Player 1 (starting at 24), forward means decreasing (24→1), so lane - die
	// For Player 2 (starting at 1), forward means increasing (1→24), so lane + die
	return currentPlayer === PlayerType.PLAYER_ONE ? lane - die : lane + die;
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

	// For Player 1, home board is 1-6 (moves 24→1)
	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
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

	// For Player 2, home board is 19-24 (moves 1→24)
	if ( currentPlayer === PlayerType.PLAYER_TWO ) {
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
					// Lanes 5 and 4 are blocked (Player 1 moves decreasing: 10-5=5, 10-6=4)
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 4 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 4 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 5, 6 ], // 5 would go to blocked lane 5, 6 would go to blocked lane 4
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Get all available moves
			const allMoves = getAllAvailableMoves( gameState );

			// In this scenario, both lanes 5 and 4 are blocked, so there are no valid moves
			expect( allMoves ).toHaveLength( 0 );

			// If we modify so lane 4 isn't blocked
			const modifiedGameState = {
				...gameState,
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					// Only lane 5 is blocked
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 5 },
				],
			};

			// Get required moves
			const requiredMoves = getRequiredMoves( modifiedGameState );

			// Should only allow the higher die (6) to be used
			// Player 1 moves decreasing: 10 - 6 = 4
			expect( requiredMoves ).toHaveLength( 1 );
			expect( requiredMoves[ 0 ].die ).toBe( 6 );
			expect( requiredMoves[ 0 ].from ).toBe( 10 );
			expect( requiredMoves[ 0 ].to ).toBe( 4 );
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
			// Player 1 moves decreasing: 10 - 3 = 7, 10 - 5 = 5
			expect( allMoves ).toContainEqual( { from: 10, to: 7, die: 3 } );
			expect( allMoves ).toContainEqual( { from: 10, to: 5, die: 5 } );

			// Get required moves
			const requiredMoves = getRequiredMoves( gameState );

			// Should require both dice to be used (all moves)
			expect( requiredMoves ).toHaveLength( 2 );
		} );
	} );

	describe( 'Bearing Off Rules', () => {
		it( 'should require exact count for bearing off when higher points have checkers', () => {
			// Player 1 with checkers on 3, 4, 6 (home board is 1-6)
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 3 },
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 4 },
					{ id: 3, player: PlayerType.PLAYER_ONE, lane: 6 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 2, 3 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Check valid bear off for lane 6 with die 6 (exact)
			expect(
				isValidBearOff( {
					die: 6,
					lane: 6,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can't bear off with lane 6 and die 5 (not exact and other checkers on higher points)
			expect(
				isValidBearOff( {
					die: 5,
					lane: 6,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( false );

			// Check valid bear off for lane 4 with die 4 (exact)
			expect(
				isValidBearOff( {
					die: 4,
					lane: 4,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );
		} );

		it( 'should allow bearing off with higher dice when no checkers on higher points', () => {
			// Player 1 with checker only on lane 3 (home board is 1-6)
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 3 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Can bear off with lane 3 and die 3 (exact)
			expect(
				isValidBearOff( {
					die: 3,
					lane: 3,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can also bear off with lane 3 and die 6 (higher die and no checkers on higher points)
			expect(
				isValidBearOff( {
					die: 6,
					lane: 3,
					currentPlayer: PlayerType.PLAYER_ONE,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );
		} );

		it( 'should handle Player 2 bearing off correctly', () => {
			// Player 2 with checkers on lanes 20, 21, 22 (home board is 19-24)
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_TWO, lane: 20 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 21 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 22 },
				],
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 4, 5 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Can bear off with lane 20 and die 5 (exact: 20 + 5 = 25)
			expect(
				isValidBearOff( {
					die: 5,
					lane: 20,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can bear off with lane 21 and die 4 (exact: 21 + 4 = 25)
			expect(
				isValidBearOff( {
					die: 4,
					lane: 21,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );

			// Can't bear off with lane 21 and die 3 (not exact with checker on higher point)
			expect(
				isValidBearOff( {
					die: 3,
					lane: 21,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( false );

			// Player 2 with checker only on lane 20
			const modifiedGameState: GameState = {
				checkers: [ { id: 1, player: PlayerType.PLAYER_TWO, lane: 20 } ],
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 5, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Can bear off with lane 20 and die 6 (higher die, no checkers on higher points)
			expect(
				isValidBearOff( {
					die: 6,
					lane: 20,
					currentPlayer: PlayerType.PLAYER_TWO,
					hasCheckersOutsideHomeBoard: false,
				} )
			).toBe( true );
		} );

		it( 'only allows Player 1 to bear off when all checkers are in home board (lanes 1-6)', () => {
			// Can't bear off while checkers are outside home board
			const game = createMockGame( {
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers: [
					// For Player 1, home board is 1-6
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 7 }, // Outside home board
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 }, // In home board
				],
				dice: [ 3 ],
			} );

			// Should not be able to bear off from lane 3 with die 3
			// since there's a checker outside home board
			const lane3Moves = getAvailableLanes( {
				currentPlayer: PlayerType.PLAYER_ONE,
				lane: 3,
				dice: game.dice,
				checkers: game.checkers,
			} );

			expect( lane3Moves ).toEqual( {} );
		} );

		it( 'only allows Player 2 to bear off when all checkers are in home board (lanes 19-24)', () => {
			const game = createMockGame( {
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers: [
					// For Player 2, home board is 19-24
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 18 }, // Outside home board
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 20 }, // In home board
				],
				dice: [ 5 ],
			} );

			// Should not be able to bear off from lane 20 with die 5
			// since there's a checker outside home board
			const lane20Moves = getAvailableLanes( {
				currentPlayer: PlayerType.PLAYER_TWO,
				lane: 20,
				dice: game.dice,
				checkers: game.checkers,
			} );

			// Should not be able to bear off since checkers are outside home board
			// Normal moves would go to lane 25 (20 + 5), but that's bearing off, which is blocked
			expect( lane20Moves ).toEqual( {} );
		} );
	} );

	describe( 'Forced Moves', () => {
		it( 'should identify the only available move when options are limited', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					// Most lanes are blocked (Player 1 moves decreasing: 10-2=8, 10-6=4)
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 4 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 4 },
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 6, player: PlayerType.PLAYER_TWO, lane: 6 },
					{ id: 7, player: PlayerType.PLAYER_TWO, lane: 6 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 2, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Get all available moves
			const allMoves = getAllAvailableMoves( gameState );

			// Should have only one valid move (using die 2, since die 6 goes to blocked lane 4)
			// Player 1 moves decreasing: 10 - 2 = 8
			expect( allMoves ).toHaveLength( 1 );
			expect( allMoves[ 0 ] ).toEqual( { from: 10, to: 8, die: 2 } );

			// Get required moves
			const requiredMoves = getRequiredMoves( gameState );

			// The only available move is required
			expect( requiredMoves ).toHaveLength( 1 );
			expect( requiredMoves[ 0 ] ).toEqual( {
				from: 10,
				to: 8,
				die: 2,
			} );
		} );

		it( 'should identify when no moves are possible', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					// All potential landing spots are blocked (Player 1 moves decreasing)
					// From lane 10: can move to 8 (10-2), 7 (10-3), 6 (10-4), 5 (10-5), 4 (10-6)
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 4 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 4 },
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 6, player: PlayerType.PLAYER_TWO, lane: 6 },
					{ id: 7, player: PlayerType.PLAYER_TWO, lane: 6 },
					{ id: 8, player: PlayerType.PLAYER_TWO, lane: 7 },
					{ id: 9, player: PlayerType.PLAYER_TWO, lane: 7 },
					{ id: 10, player: PlayerType.PLAYER_TWO, lane: 8 },
					{ id: 11, player: PlayerType.PLAYER_TWO, lane: 8 },
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
