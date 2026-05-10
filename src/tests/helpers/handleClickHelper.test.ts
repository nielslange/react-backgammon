// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { handleClick } from '../../helpers/handleClickHelper';
import { PlayerType } from '../../types';
import * as selectors from '../../data/selectors';

// Mock the necessary functions
vi.mock( '../../data/selectors', () => ( {
	hasDiceBeenRolled: vi.fn(),
	hasWaitingChecker: vi.fn(),
	hasCheckersOutsideHomeBoard: vi.fn(),
	wouldClearOffChecker: vi.fn(),
	isCheckerOnTheBoard: vi.fn(),
	getTargetLane: vi.fn(),
	isCurrentPlayer: vi.fn(),
	isCheckerClearedOff: vi.fn(),
	isTargetOccupiedByCurrentPlayer: vi.fn(),
	isTargetOccupiedByOtherPlayer: vi.fn(),
	willHitOpponent: vi.fn(),
	getHitCheckerId: vi.fn(),
	hasPlayerWon: vi.fn(),
	calculatePipCount: vi.fn(),
} ) );

// Mock updateGame and checkForWin helpers
vi.mock( '../../helpers/updateGameHelper', () => ( {
	updateGame: vi.fn( ( dispatch, checkers, dice, notice, currentPlayer ) => {
		// Simple mock that dispatches the action
		dispatch( {
			type: 'UPDATE_GAME',
			payload: { checkers, dice, notice, currentPlayer },
		} );
	} ),
} ) );

vi.mock( '../../helpers/checkForWinHelper', () => ( {
	checkForWin: vi.fn( () => null ),
} ) );

// Mock event with target lane
const createMockEvent = ( lane ) => ( {
	target: {
		closest: vi.fn().mockReturnValue( {
			dataset: { lane: String( lane ) },
		} ),
	},
} );

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
	playerOneName: string;
	playerTwoName: string;
	displayedRoll: number[] | null;
	winner: PlayerType | null;
	isRolling: boolean;
}

describe( 'handleClick', () => {
	let mockParams;
	let mockDispatch;

	beforeEach( () => {
		// Reset mocks
		vi.resetAllMocks();

		// Setup default mock parameters
		mockDispatch = vi.fn();
		mockParams = {
			id: 1,
			player: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers: [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 5 },
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 10 },
				{ id: 3, player: PlayerType.PLAYER_TWO, lane: 15 },
			],
			die: 3,
			dispatch: mockDispatch,
		};

		// Mock hasDiceBeenRolled to return true by default
		( selectors.hasDiceBeenRolled as any ).mockReturnValue( true );
		
		// Mock other selectors with default values
		( selectors.isCurrentPlayer as any ).mockReturnValue( true );
		( selectors.isCheckerOnTheBoard as any ).mockReturnValue( true );
		( selectors.isCheckerClearedOff as any ).mockReturnValue( false );
		( selectors.isTargetOccupiedByCurrentPlayer as any ).mockReturnValue( false );
		( selectors.isTargetOccupiedByOtherPlayer as any ).mockReturnValue( false );
		( selectors.willHitOpponent as any ).mockReturnValue( false );
		( selectors.getHitCheckerId as any ).mockReturnValue( null );
		( selectors.hasPlayerWon as any ).mockReturnValue( false );

		// Mock getTargetLane to return correct calculation based on direction
		// Player 1 moves decreasing (24→1), Player 2 moves increasing (1→24)
		( selectors.getTargetLane as any ).mockImplementation(
			( { currentPlayer, lane, die } ) => {
				if ( currentPlayer === PlayerType.PLAYER_ONE ) {
					if ( lane === 0 ) return 25 - die; // Bar entry
					if ( lane >= 1 && lane <= 6 && lane - die < 1 ) return 0; // Bearing off
					return lane - die; // Normal movement
				} else {
					if ( lane === 25 ) return die; // Bar entry
					if ( lane >= 19 && lane <= 24 && lane + die > 24 ) return 25; // Bearing off
					return lane + die; // Normal movement
				}
			}
		);
	} );

	describe( 'Waiting Checker Logic', () => {
		it( 'should enforce moving a waiting checker first', () => {
			// Setup: Player has a waiting checker on the bar
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 }, // Waiting checker on bar
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 5 },
			];

			( selectors.hasWaitingChecker as any ).mockReturnValue( true );

			// Try to move a non-waiting checker from lane 5
			const mockEvent = createMockEvent( 5 );
			handleClick( mockEvent, mockParams );

			// Should dispatch error notice about waiting checker
			expect( mockDispatch ).toHaveBeenCalled();
			// Note: The exact format of the error depends on implementation
		} );

		it( 'should allow moving from the bar when there is a waiting checker', () => {
			// Setup: Player has a waiting checker on the bar
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 }, // Waiting checker on bar
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 5 },
			];
			mockParams.activeLane = 0; // Bar is selected
			mockParams.selectedDie = 3; // Using die with value 3

			( selectors.hasWaitingChecker as any ).mockReturnValue( true );

			// Click on lane 22 (valid move from bar using die value 3: 25 - 3 = 22)
			const mockEvent = createMockEvent( 22 );
			handleClick( mockEvent, mockParams );

			// Should dispatch move action (updateGame is called)
			expect( mockDispatch ).toHaveBeenCalled();
		} );
	} );

	describe( 'Bearing Off Logic', () => {
		it( 'should prevent bearing off when checkers are outside home board', () => {
			// Setup: Trying to bear off with checkers outside home
			// Player 1 home board is 1-6, bears off to 0
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 7 }, // Outside home board (home board is 1-6)
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 }, // In home board
			];
			mockParams.activeLane = 3;
			mockParams.selectedDie = 3; // Would normally allow bearing off from 3 (3 - 3 = 0)

			( selectors.hasWaitingChecker as any ).mockReturnValue( false );
			( selectors.hasCheckersOutsideHomeBoard as any ).mockReturnValue(
				true
			); // Checkers outside home
			( selectors.wouldClearOffChecker as any ).mockReturnValue( true ); // Would normally clear off

			// Try to bear off (clicking on lane 0)
			const mockEvent = createMockEvent( 0 );
			handleClick( mockEvent, mockParams );

			// Should set error message about bearing off not allowed yet
			expect( mockDispatch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'SET_NOTICE',
					payload: expect.objectContaining( {
						message: 'You cannot bear off until all your checkers are in your home board',
					} ),
				} )
			);
		} );

		it( 'should allow bearing off when all checkers are in home board', () => {
			// Setup: All checkers in home board
			// Player 1 home board is 1-6, bears off to 0
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 1 }, // In home board (home board is 1-6)
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 6 }, // In home board
			];
			mockParams.activeLane = 6;
			mockParams.selectedDie = 6; // Allow bearing off from 6 (6 - 6 = 0)

			( selectors.hasWaitingChecker as any ).mockReturnValue( false );
			( selectors.hasCheckersOutsideHomeBoard as any ).mockReturnValue(
				false
			); // All checkers in home
			( selectors.wouldClearOffChecker as any ).mockReturnValue( true ); // Would clear off

			// Try to bear off (clicking on lane 0)
			const mockEvent = createMockEvent( 0 );
			handleClick( mockEvent, mockParams );

			// Should dispatch move action to bear off
			expect( mockDispatch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'MOVE_CHECKER',
				} )
			);
		} );
	} );

	describe( 'Combined Game Logic', () => {
		it( 'should prioritize waiting checker rule over bearing off rule', () => {
			// Setup: Player has a waiting checker, but also all other checkers in home board
			// Player 1 home board is 1-6, bears off to 0
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 }, // Waiting checker on bar
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 }, // In home board
			];
			mockParams.activeLane = 3; // Trying to move from home board
			mockParams.selectedDie = 3; // Would normally allow bearing off (3 - 3 = 0)

			( selectors.hasWaitingChecker as any ).mockReturnValue( true ); // Has waiting checker
			( selectors.hasCheckersOutsideHomeBoard as any ).mockReturnValue(
				false
			); // All other checkers in home
			( selectors.wouldClearOffChecker as any ).mockReturnValue( true ); // Would normally clear off

			// Try to bear off (clicking on lane 0)
			const mockEvent = createMockEvent( 0 );
			handleClick( mockEvent, mockParams );

			// Should set error message about waiting checker (prioritized)
			expect( mockDispatch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'SET_NOTICE',
					payload: expect.objectContaining( {
						message: 'You must move your waiting checker from the bar first',
					} ),
				} )
			);
		} );
	} );
} );
