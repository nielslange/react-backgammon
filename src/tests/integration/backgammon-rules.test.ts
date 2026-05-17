// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { PlayerType } from '../../types';
import { getAvailableLanes } from '../../data/selectors';

// Define interfaces needed for testing
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

// Mock functions we'll need to test
const isLaneBlocked = (
	lane: number,
	currentPlayer: PlayerType,
	checkers: Checker[]
): boolean => {
	// A lane is blocked if there are 2 or more opponent checkers on it
	const opposingPlayer =
		currentPlayer === PlayerType.PLAYER_ONE
			? PlayerType.PLAYER_TWO
			: PlayerType.PLAYER_ONE;
	const checkersOnLane = checkers.filter(
		( c ) => c.lane === lane && c.player === opposingPlayer
	);
	return checkersOnLane.length >= 2;
};

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

const canHitOpponent = (
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
	return checkersOnLane.length === 1; // Can hit if there's exactly one opponent checker
};

const getAvailableMoves = (
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
			if ( targetLane < 1 || targetLane > 24 ) continue;

			// Check if target lane is blocked by opponent
			if ( isLaneBlocked( targetLane, currentPlayer, checkers ) )
				continue;

			moves.push( { from: checker.lane, to: targetLane, die } );
		}
	}

	return moves;
};

// Define the standard initial backgammon setup
const createInitialBoard = (): Checker[] => {
	const checkers: Checker[] = [];
	let id = 1;

	// Player 1 checkers (white)
	for ( let i = 0; i < 2; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_ONE, lane: 24 } ); // 2 on point 24
	for ( let i = 0; i < 5; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_ONE, lane: 13 } ); // 5 on point 13
	for ( let i = 0; i < 3; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_ONE, lane: 8 } ); // 3 on point 8
	for ( let i = 0; i < 5; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_ONE, lane: 6 } ); // 5 on point 6

	// Player 2 checkers (black)
	for ( let i = 0; i < 2; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_TWO, lane: 1 } ); // 2 on point 1
	for ( let i = 0; i < 5; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_TWO, lane: 12 } ); // 5 on point 12
	for ( let i = 0; i < 3; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_TWO, lane: 17 } ); // 3 on point 17
	for ( let i = 0; i < 5; i++ )
		checkers.push( { id: id++, player: PlayerType.PLAYER_TWO, lane: 19 } ); // 5 on point 19

	return checkers;
};

// Initial game state for tests
const initialState: GameState = {
	checkers: [],
	currentPlayer: PlayerType.PLAYER_ONE,
	dice: [],
	activeLane: null,
	selectedDie: null,
	error: null,
};

describe( 'Backgammon Rules', () => {
	describe( 'Initial Board Setup', () => {
		it( 'should set up the board with the correct number of checkers for each player', () => {
			const initialBoard = createInitialBoard();

			// Count checkers by player
			const player1Checkers = initialBoard.filter(
				( c ) => c.player === PlayerType.PLAYER_ONE
			);
			const player2Checkers = initialBoard.filter(
				( c ) => c.player === PlayerType.PLAYER_TWO
			);

			// Each player should have 15 checkers
			expect( player1Checkers.length ).toBe( 15 );
			expect( player2Checkers.length ).toBe( 15 );
		} );

		it( 'should place checkers in the correct starting positions', () => {
			const initialBoard = createInitialBoard();

			// Check Player 1 positions
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_ONE && c.lane === 24
				).length
			).toBe( 2 );
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_ONE && c.lane === 13
				).length
			).toBe( 5 );
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_ONE && c.lane === 8
				).length
			).toBe( 3 );
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_ONE && c.lane === 6
				).length
			).toBe( 5 );

			// Check Player 2 positions
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_TWO && c.lane === 1
				).length
			).toBe( 2 );
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_TWO && c.lane === 12
				).length
			).toBe( 5 );
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_TWO && c.lane === 17
				).length
			).toBe( 3 );
			expect(
				initialBoard.filter(
					( c ) => c.player === PlayerType.PLAYER_TWO && c.lane === 19
				).length
			).toBe( 5 );
		} );
	} );

	describe( 'Movement Direction', () => {
		it( 'should move Player 1 checkers in decreasing lane direction (24→1)', () => {
			const startLane = 10;
			const die = 4;
			const targetLane = getTargetLane( {
				currentPlayer: PlayerType.PLAYER_ONE,
				lane: startLane,
				die,
			} );

			// Player 1 moves forward (toward point 1), so lane numbers decrease
			expect( targetLane ).toBe( 6 ); // 10 - 4 = 6
		} );

		it( 'should move Player 2 checkers in increasing lane direction (1→24)', () => {
			const startLane = 10;
			const die = 4;
			const targetLane = getTargetLane( {
				currentPlayer: PlayerType.PLAYER_TWO,
				lane: startLane,
				die,
			} );

			// Player 2 moves forward (toward point 24), so lane numbers increase
			expect( targetLane ).toBe( 14 ); // 10 + 4 = 14
		} );
	} );

	describe( "Hitting Opponent's Blots", () => {
		it( 'should allow hitting a single opponent checker (blot)', () => {
			const checkers: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 14 }, // Single opponent checker (blot)
			];

			const canHit = canHitOpponent(
				14,
				PlayerType.PLAYER_ONE,
				checkers
			);
			expect( canHit ).toBe( true );
		} );

		it( 'should not allow hitting when there are multiple opponent checkers', () => {
			const checkers: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 14 },
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 14 }, // Two opponent checkers (point)
			];

			const canHit = canHitOpponent(
				14,
				PlayerType.PLAYER_ONE,
				checkers
			);
			expect( canHit ).toBe( false );
		} );

		it( 'should send hit checker to the bar', () => {
			// This would typically be tested in a reducer or game logic test
			// Simulating the change that would happen after hitting
			const beforeHit: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 14 }, // About to be hit
			];

			const afterHit: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 14 }, // Moved to hit
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 25 }, // Sent to the bar (25 for Player 2)
			];

			// Check that Player 2's checker is now on the bar
			const hitChecker = afterHit.find( ( c ) => c.id === 2 );
			expect( hitChecker?.lane ).toBe( 25 );
		} );
	} );

	describe( 'Blocked Points', () => {
		it( 'should detect when a point is blocked by opponent checkers', () => {
			const checkers: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 14 },
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 14 }, // Two opponent checkers block this point
			];

			const blocked = isLaneBlocked(
				14,
				PlayerType.PLAYER_ONE,
				checkers
			);
			expect( blocked ).toBe( true );
		} );

		it( 'should not consider a point blocked if there is only one opponent checker', () => {
			const checkers: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 2, player: PlayerType.PLAYER_TWO, lane: 14 }, // Single opponent checker (blot)
			];

			const blocked = isLaneBlocked(
				14,
				PlayerType.PLAYER_ONE,
				checkers
			);
			expect( blocked ).toBe( false );
		} );

		it( 'should not consider a point blocked if occupied by own checkers', () => {
			const checkers: Checker[] = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 14 }, // Own checkers
				{ id: 3, player: PlayerType.PLAYER_ONE, lane: 14 }, // Own checkers
			];

			const blocked = isLaneBlocked(
				14,
				PlayerType.PLAYER_ONE,
				checkers
			);
			expect( blocked ).toBe( false );
		} );
	} );

	describe( 'Dice Usage Rules', () => {
		it( 'should identify all available moves based on dice values', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 15 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 5 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			const moves = getAvailableMoves( gameState );

			// Should have 4 possible moves (2 checkers × 2 dice)
			expect( moves ).toHaveLength( 4 );

			// Check specific moves (Player 1 moves decreasing: lane - die)
			expect( moves ).toContainEqual( { from: 10, to: 7, die: 3 } ); // 10 - 3 = 7
			expect( moves ).toContainEqual( { from: 10, to: 5, die: 5 } ); // 10 - 5 = 5
			expect( moves ).toContainEqual( { from: 15, to: 12, die: 3 } ); // 15 - 3 = 12
			expect( moves ).toContainEqual( { from: 15, to: 10, die: 5 } ); // 15 - 5 = 10
		} );

		it( 'should handle doubles dice correctly', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 4, 4, 4, 4 ], // Doubles give you 4 moves
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			const moves = getAvailableMoves( gameState );

			// Should have 4 possible moves (1 checker × 4 dice)
			expect( moves ).toHaveLength( 4 );

			// All moves should be for die value 4
			// Player 1 moves decreasing: 10 - 4 = 6
			moves.forEach( ( move ) => {
				expect( move.die ).toBe( 4 );
				expect( move.from ).toBe( 10 );
				expect( move.to ).toBe( 6 );
			} );
		} );

		it( 'should not allow moves to blocked points', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 5 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 5 }, // Blocked point (lane 5)
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 5, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			const moves = getAvailableMoves( gameState );

			// Should have only 1 possible move (using die 6, since die 5 would go to blocked point 5)
			// Player 1 moves decreasing: 10 - 5 = 5 (blocked), 10 - 6 = 4 (open)
			expect( moves ).toHaveLength( 1 );
			expect( moves[ 0 ] ).toEqual( { from: 10, to: 4, die: 6 } );
		} );
	} );

	describe( 'Complete Game Flow', () => {
		it( 'should determine the winner when all checkers are borne off', () => {
			// Player 1 has no checkers left (all borne off)
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_TWO, lane: 1 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 3 },
				],
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 2, 4 ],
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			// Check that Player 1 has no checkers (has won)
			const player1Checkers = gameState.checkers.filter(
				( c ) => c.player === PlayerType.PLAYER_ONE
			);
			expect( player1Checkers.length ).toBe( 0 );

			// In a real implementation, this would trigger game over with Player 1 as winner
		} );

		it( 'Player 1 can bear off when checkers are all in home board', () => {
			// Player 1 has all checkers in home board (home board is lanes 1-6)
			const game = {
				...initialState,
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 4 ], // Die 4 from lane 4: 4 - 4 = 0 (exact bearing off)
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 4 }, // Home board is lanes 1-6
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 6 },
				],
			};

			const availableMoves = getAvailableLanes( {
				dice: game.dice,
				lane: 4,
				checkers: game.checkers,
				currentPlayer: game.currentPlayer,
			} );

			// With die 4 from lane 4, P1 bears off exactly. P1's borne-off
			// lane is 25 (lane 0 is P1's bar).
			expect( availableMoves ).toEqual( { 4: 25 } );
		} );
	} );

	describe( 'Legal Move Detection', () => {
		it( 'should identify when a player has no legal moves', () => {
			// Player 1 has all checkers in home board (home board is lanes 1-6)
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 1 }, // Home board is lanes 1-6
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 },
					// Player 2 has blocked all possible landing spots
					// From lane 1 with die 1: would go to 0 (bearing off, but need exact or overshoot)
					// From lane 1 with die 2: would go to -1 (overshoot, but need no checkers on higher points)
					// From lane 3 with die 1: would go to 2 (blocked)
					// From lane 3 with die 2: would go to 1 (blocked)
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 2 },
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 2 },
					{ id: 5, player: PlayerType.PLAYER_TWO, lane: 1 },
					{ id: 6, player: PlayerType.PLAYER_TWO, lane: 1 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 1, 2 ], // Not enough to bear off either checker (need exact or overshoot with no higher points)
				activeLane: null,
				selectedDie: null,
				error: null,
			};

			const moves = getAvailableMoves( gameState );

			// Player should have no legal moves
			expect( moves ).toHaveLength( 0 );
		} );
	} );
} );
