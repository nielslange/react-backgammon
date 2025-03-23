// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { handleClick } from '../../helpers/handleClickHelper';
import { PlayerType } from '../../types';
import * as selectors from '../../data/selectors';

// Mock the necessary functions
vi.mock( '../../data/selectors', () => ( {
	hasWaitingChecker: vi.fn(),
	hasCheckoutsOutsideEndzone: vi.fn(),
	wouldClearOffChecker: vi.fn(),
	isCheckerOnTheBoard: vi.fn(),
	getTargetLane: vi.fn(),
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

		// Mock getTargetLane to return a simple calculation based on direction
		( selectors.getTargetLane as any ).mockImplementation(
			( { currentPlayer, lane, die } ) => {
				return currentPlayer === PlayerType.PLAYER_ONE
					? lane + die
					: lane - die;
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

			// Click on lane 3 (valid move from bar using die value 3)
			const mockEvent = createMockEvent( 3 );
			handleClick( mockEvent, mockParams );

			// Should dispatch move action
			expect( mockDispatch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'MOVE_CHECKER',
				} )
			);
		} );
	} );

	describe( 'Bearing Off Logic', () => {
		it( 'should prevent bearing off when checkers are outside home board', () => {
			// Setup: Trying to bear off with checkers outside home
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 18 }, // Outside home board
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 }, // In home board
			];
			mockParams.activeLane = 24;
			mockParams.selectedDie = 1; // Would normally allow bearing off from 24

			( selectors.hasWaitingChecker as any ).mockReturnValue( false );
			( selectors.hasCheckoutsOutsideEndzone as any ).mockReturnValue(
				true
			); // Checkers outside home
			( selectors.wouldClearOffChecker as any ).mockReturnValue( true ); // Would normally clear off

			// Try to bear off
			const mockEvent = createMockEvent( 25 );
			handleClick( mockEvent, mockParams );

			// Should set error message about bearing off not allowed yet
			expect( mockDispatch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'SET_ERROR',
					payload:
						'You cannot bear off until all your checkers are in your home board',
				} )
			);
		} );

		it( 'should allow bearing off when all checkers are in home board', () => {
			// Setup: All checkers in home board
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 19 }, // In home board
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 }, // In home board
			];
			mockParams.activeLane = 24;
			mockParams.selectedDie = 1; // Allow bearing off from 24

			( selectors.hasWaitingChecker as any ).mockReturnValue( false );
			( selectors.hasCheckoutsOutsideEndzone as any ).mockReturnValue(
				false
			); // All checkers in home
			( selectors.wouldClearOffChecker as any ).mockReturnValue( true ); // Would clear off

			// Try to bear off
			const mockEvent = createMockEvent( 25 );
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
			mockParams.checkers = [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 }, // Waiting checker on bar
				{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 }, // In home board
			];
			mockParams.activeLane = 24; // Trying to move from home board
			mockParams.selectedDie = 1; // Would normally allow bearing off

			( selectors.hasWaitingChecker as any ).mockReturnValue( true ); // Has waiting checker
			( selectors.hasCheckoutsOutsideEndzone as any ).mockReturnValue(
				false
			); // All other checkers in home
			( selectors.wouldClearOffChecker as any ).mockReturnValue( true ); // Would normally clear off

			// Try to bear off
			const mockEvent = createMockEvent( 25 );
			handleClick( mockEvent, mockParams );

			// Should set error message about waiting checker (prioritized)
			expect( mockDispatch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'SET_ERROR',
					payload:
						'You must move your waiting checker from the bar first',
				} )
			);
		} );
	} );
} );
