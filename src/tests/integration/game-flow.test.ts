// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { PlayerType } from '../../types';

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
	winner: PlayerType | null;
}

// Function to simulate a move
const simulateMove = (
	gameState: GameState,
	from: number,
	to: number,
	die: number
): GameState => {
	const { checkers, currentPlayer, dice } = gameState;

	// Create a copy of the checkers array
	const newCheckers = [ ...checkers ];

	// Find the checker to move
	const checkerIndex = newCheckers.findIndex(
		( c ) => c.player === currentPlayer && c.lane === from
	);

	if ( checkerIndex === -1 ) {
		// Checker not found, return unchanged state
		return gameState;
	}

	// Check if there's an opponent's blot at the destination
	const hitCheckerIndex = newCheckers.findIndex(
		( c ) => c.player !== currentPlayer && c.lane === to
	);

	// Handle hitting an opponent's checker
	if ( hitCheckerIndex !== -1 && to !== -1 ) {
		// Send opponent's checker to the bar
		newCheckers[ hitCheckerIndex ].lane =
			currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
	}

	// Update the checker's position
	newCheckers[ checkerIndex ].lane = to;

	// Remove the used die
	const newDice = dice.filter(
		( d, index ) => index !== dice.indexOf( die )
	);

	// Toggle player if no dice left
	const newCurrentPlayer =
		newDice.length === 0
			? currentPlayer === PlayerType.PLAYER_ONE
				? PlayerType.PLAYER_TWO
				: PlayerType.PLAYER_ONE
			: currentPlayer;

	// Check for a winner
	const player1Checkers = newCheckers.filter(
		( c ) => c.player === PlayerType.PLAYER_ONE
	);
	const player2Checkers = newCheckers.filter(
		( c ) => c.player === PlayerType.PLAYER_TWO
	);

	let winner = null;
	// Borne-off lane: 0 for P1, 25 for P2 (matches real game logic).
	// Only the player who just moved can win this turn — check them first.
	if (
		currentPlayer === PlayerType.PLAYER_ONE &&
		player1Checkers.every( ( c ) => c.lane === 0 )
	) {
		winner = PlayerType.PLAYER_ONE;
	} else if (
		currentPlayer === PlayerType.PLAYER_TWO &&
		player2Checkers.every( ( c ) => c.lane === 25 )
	) {
		winner = PlayerType.PLAYER_TWO;
	}

	return {
		...gameState,
		checkers: newCheckers,
		dice: newDice,
		currentPlayer: newCurrentPlayer,
		activeLane: null,
		selectedDie: null,
		winner,
	};
};

// Function to roll dice
const rollDice = (): number[] => {
	return [
		Math.floor( Math.random() * 6 ) + 1,
		Math.floor( Math.random() * 6 ) + 1,
	];
};

describe( 'Game Flow', () => {
	describe( 'Turn Alternation', () => {
		it( 'should alternate turns after a player uses all dice', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 15 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 5 ],
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Player 1 makes a move with die 3
			const afterFirstMove = simulateMove( gameState, 10, 13, 3 );

			// Current player should still be Player 1 with one die left
			expect( afterFirstMove.currentPlayer ).toBe(
				PlayerType.PLAYER_ONE
			);
			expect( afterFirstMove.dice ).toHaveLength( 1 );
			expect( afterFirstMove.dice[ 0 ] ).toBe( 5 );

			// Player 1 makes second move with die 5
			const afterSecondMove = simulateMove( afterFirstMove, 13, 18, 5 );

			// Now it should be Player 2's turn with new dice
			expect( afterSecondMove.currentPlayer ).toBe(
				PlayerType.PLAYER_TWO
			);
			expect( afterSecondMove.dice ).toHaveLength( 0 );
		} );

		it( 'should not change turns if dice are still available', () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 15 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 4, 4, 4, 4 ], // Doubles
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Player 1 makes a move with one of the 4s
			const afterFirstMove = simulateMove( gameState, 10, 14, 4 );

			// Current player should still be Player 1 with three dice left
			expect( afterFirstMove.currentPlayer ).toBe(
				PlayerType.PLAYER_ONE
			);
			expect( afterFirstMove.dice ).toHaveLength( 3 );

			// Player 1 makes a second move
			const afterSecondMove = simulateMove( afterFirstMove, 14, 18, 4 );

			// Current player should still be Player 1 with two dice left
			expect( afterSecondMove.currentPlayer ).toBe(
				PlayerType.PLAYER_ONE
			);
			expect( afterSecondMove.dice ).toHaveLength( 2 );
		} );
	} );

	describe( 'Hitting and Re-entering', () => {
		it( "should correctly handle hitting an opponent's blot", () => {
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 13 }, // Blot that will be hit
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3 ],
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Player 1 hits Player 2's blot
			const afterHit = simulateMove( gameState, 10, 13, 3 );

			// Player 1's checker should be on lane 13
			const player1Checker = afterHit.checkers.find(
				( c ) => c.id === 1
			);
			expect( player1Checker?.lane ).toBe( 13 );

			// Player 2's checker should be on the bar (lane 25)
			const player2Checker = afterHit.checkers.find(
				( c ) => c.id === 2
			);
			expect( player2Checker?.lane ).toBe( 25 );
		} );

		it( 'should require re-entering from the bar before making other moves', () => {
			// This would be tested in a more complete game logic implementation
			// For this test, we'll just verify the state that would trigger this rule

			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 10 },
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 25 }, // On the bar
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 5 },
				],
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 2, 3 ],
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Verify Player 2 has a checker on the bar that needs to re-enter
			const waitingCheckers = gameState.checkers.filter(
				( c ) => c.player === gameState.currentPlayer && c.lane === 25
			);

			expect( waitingCheckers ).toHaveLength( 1 );
			expect( waitingCheckers[ 0 ].id ).toBe( 2 );
		} );
	} );

	describe( 'Winning Conditions', () => {
		it( 'should detect when Player 1 has won', () => {
			// Setup: Player 1 has all checkers borne off except one
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 24 }, // Last checker
					{ id: 2, player: PlayerType.PLAYER_TWO, lane: 1 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 3 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 1 ],
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Player 1 bears off last checker (P1 bear-off lane is 0)
			const afterBearOff = simulateMove( gameState, 24, 0, 1 );

			// Player 1 should be declared the winner
			expect( afterBearOff.winner ).toBe( PlayerType.PLAYER_ONE );
		} );

		it( 'should detect when Player 2 has won', () => {
			// Setup: Player 2 has all checkers borne off except one
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 19 },
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 20 },
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 1 }, // Last checker
				],
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 1 ],
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Player 2 bears off last checker (P2 bear-off lane is 25)
			const afterBearOff = simulateMove( gameState, 1, 25, 1 );

			// Player 2 should be declared the winner
			expect( afterBearOff.winner ).toBe( PlayerType.PLAYER_TWO );
		} );

		it( 'should not declare a winner if not all checkers are borne off', () => {
			// Setup: Player 1 has one checker borne off, one still on the board
			const gameState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 24 }, // Still on board
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: -1 }, // Already borne off
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 1 },
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 2 ],
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Player 1 makes a move but doesn't bear off
			const afterMove = simulateMove( gameState, 24, 22, 2 );

			// No winner should be declared yet
			expect( afterMove.winner ).toBeNull();
		} );
	} );

	describe( 'Complete Game Simulation', () => {
		it( 'should simulate a basic game flow until a player wins', () => {
			// For testing purposes, we'll use a simplified board with just a few checkers
			// Player 1 home board is 1-6, Player 2 home board is 19-24
			const initialState: GameState = {
				checkers: [
					{ id: 1, player: PlayerType.PLAYER_ONE, lane: 5 }, // In home board (1-6)
					{ id: 2, player: PlayerType.PLAYER_ONE, lane: 6 }, // In home board
					{ id: 3, player: PlayerType.PLAYER_TWO, lane: 20 }, // In home board (19-24)
					{ id: 4, player: PlayerType.PLAYER_TWO, lane: 21 }, // In home board
				],
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 5, 6 ],
				activeLane: null,
				selectedDie: null,
				error: null,
				winner: null,
			};

			// Player 1's turn - bear off both checkers (bearing off to 0)
			const afterPlayer1Move1 = simulateMove( initialState, 6, 0, 6 );
			const afterPlayer1Move2 = simulateMove(
				afterPlayer1Move1,
				5,
				0,
				5
			);

			// Should now be Player 2's turn
			expect( afterPlayer1Move2.currentPlayer ).toBe(
				PlayerType.PLAYER_TWO
			);

			// Let's give Player 2 new dice
			const player2Turn = {
				...afterPlayer1Move2,
				dice: [ 4, 5 ],
			};

			// Player 2 also bears off their checkers (bearing off to 25)
			const afterPlayer2Move1 = simulateMove( player2Turn, 21, 25, 4 );
			const afterPlayer2Move2 = simulateMove(
				afterPlayer2Move1,
				20,
				25,
				5
			);

			// Player 2 should win
			expect( afterPlayer2Move2.winner ).toBe( PlayerType.PLAYER_TWO );

			// Both players should have all checkers borne off (lane 0 for P1, 25 for P2).
			const player1CheckersLeft = afterPlayer2Move2.checkers.filter(
				( c ) => c.player === PlayerType.PLAYER_ONE && c.lane !== 0
			);
			const player2CheckersLeft = afterPlayer2Move2.checkers.filter(
				( c ) => c.player === PlayerType.PLAYER_TWO && c.lane !== 25
			);

			expect( player1CheckersLeft ).toHaveLength( 0 );
			expect( player2CheckersLeft ).toHaveLength( 0 );
		} );
	} );
} );
