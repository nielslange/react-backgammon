/**
 * Click-checker → highlighted landing points → click-point flow.
 */
import { describe, it, expect } from 'vitest';
import {
	confirmPreview,
	getEffectiveDie,
	getMoveOptions,
	getPlayableDice,
	handleCheckerSelection,
	handleDirectMove,
} from '../../helpers/moveSelectionHelper';
import { resolveMove } from '../../helpers/handleClickHelper';
import {
	restartGame,
	selectDie,
	setDice,
	setMode,
	setPreview,
	toggleCurrentPlayer,
} from '../../data/actions';
import { MessageType, PlayerType } from '../../types';
import type { CheckerType } from '../../types';
import { createTestStore, makeCheckers } from '../integration/test-utils';

const lanesOf = ( checkers: CheckerType[] ) => checkers.map( ( c ) => c.lane );

describe( 'getPlayableDice', () => {
	it( 'lists each distinct die value that has a legal move', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
		] );
		expect(
			getPlayableDice( {
				dice: [ 3, 5 ],
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
			} )
		).toEqual( [ 3, 5 ] );
	} );

	it( 'collapses doubles to a single value', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
		] );
		expect(
			getPlayableDice( {
				dice: [ 4, 4, 4, 4 ],
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
			} )
		).toEqual( [ 4 ] );
	} );

	it( 'excludes a blocked die and enforces the larger-die rule', () => {
		// P1 on 8. 8-3=5 is blocked; 8-5=3 is open.
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 8 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 5 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 5 },
		] );
		expect(
			getPlayableDice( {
				dice: [ 3, 5 ],
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
			} )
		).toEqual( [ 5 ] );
	} );

	it( 'is empty before the game starts', () => {
		expect(
			getPlayableDice( {
				dice: [ 3, 5 ],
				checkers: [],
				currentPlayer: null,
			} )
		).toEqual( [] );
	} );
} );

describe( 'resolveMove', () => {
	it( 'consumes the chosen die rather than the first one', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
		] );
		const resolved = resolveMove( {
			id: 1,
			player: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
			die: 5,
			lane: 13,
		} );
		expect( resolved.ok ).toBe( true );
		if ( resolved.ok ) {
			expect( resolved.targetLane ).toBe( 8 );
			expect( resolved.newDice ).toEqual( [ 3 ] );
			expect( resolved.newCheckers[ 0 ].lane ).toBe( 8 );
		}
	} );

	it( 'rejects a die that is not on the table', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
		] );
		const resolved = resolveMove( {
			id: 1,
			player: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
			die: 6,
			lane: 13,
		} );
		expect( resolved ).toEqual( {
			ok: false,
			message: MessageType.DIE_NOT_PLAYABLE,
		} );
	} );

	it( 'does not mutate the input position', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 8 },
		] );
		resolveMove( {
			id: 1,
			player: PlayerType.PLAYER_ONE,
			dice: [ 5 ],
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
			die: 5,
			lane: 13,
		} );
		expect( lanesOf( checkers ) ).toEqual( [ 13, 8 ] );
	} );
} );

describe( 'getMoveOptions', () => {
	it( 'returns one landing point per playable die', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 1 },
		] );
		const { options, rejection } = getMoveOptions(
			{
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 5 ],
				gameOver: false,
			},
			{ id: 1, player: PlayerType.PLAYER_ONE }
		);
		expect( options ).toEqual( [
			{ die: 5, to: 8 },
			{ die: 3, to: 10 },
		] );
		expect( rejection ).toBe( null );
	} );

	it( 'omits blocked dice and reports why when nothing is playable', () => {
		// 13-3=10 blocked, 13-5=8 blocked.
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 10 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 10 },
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 8 },
			{ id: 5, player: PlayerType.PLAYER_TWO, lane: 8 },
		] );
		const { options, rejection } = getMoveOptions(
			{
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
				dice: [ 3, 5 ],
				gameOver: false,
			},
			{ id: 1, player: PlayerType.PLAYER_ONE }
		);
		expect( options ).toEqual( [] );
		expect( rejection ).toBe( MessageType.TARGET_OCCUPIED_BY_OPPONENT );
	} );
} );

describe( 'handleCheckerSelection', () => {
	const position = () =>
		makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 1 },
		] );

	it( 'previews both landing points on the first click', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().preview ).toEqual( {
			checkerId: 1,
			from: 13,
			options: [
				{ die: 5, to: 8 },
				{ die: 3, to: 10 },
			],
		} );
		expect( store.getState().notice.message ).toBe(
			MessageType.PREVIEW_MOVE
		);
		expect( lanesOf( store.getState().checkers ) ).toEqual( [ 13, 24, 1 ] );
	} );

	it( 'clicking a landing point moves the checker with that die', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		confirmPreview( store.dispatch, store.getState(), 10 );

		const state = store.getState();
		expect( lanesOf( state.checkers ) ).toEqual( [ 10, 24, 1 ] );
		expect( state.dice ).toEqual( [ 5 ] );
		expect( state.preview ).toBe( null );
		expect( state.notice.message ).toBe( MessageType.MOVE_CHECKER );
	} );

	it( 'ignores a click on a point that is not an option', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		confirmPreview( store.dispatch, store.getState(), 9 );
		expect( lanesOf( store.getState().checkers ) ).toEqual( [ 13, 24, 1 ] );
		expect( store.getState().preview?.checkerId ).toBe( 1 );
	} );

	it( 'a second click on the checker moves it when only one option exists', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 5 ],
			checkers: position(),
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().preview?.options ).toEqual( [
			{ die: 5, to: 8 },
		] );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( lanesOf( store.getState().checkers ) ).toEqual( [ 8, 24, 1 ] );
		// Last die used: the turn was handed over and rolled for Player 2.
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_TWO );
	} );

	it( 'switching checkers replaces the preview instead of moving', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 2,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().preview?.checkerId ).toBe( 2 );
		expect( store.getState().preview?.options ).toEqual( [
			{ die: 5, to: 19 },
			{ die: 3, to: 21 },
		] );
		expect( lanesOf( store.getState().checkers ) ).toEqual( [ 13, 24, 1 ] );
	} );

	it( 'a checker without legal moves shows why and clears the preview', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 8 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 5 },
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 },
			{ id: 5, player: PlayerType.PLAYER_TWO, lane: 3 },
			{ id: 6, player: PlayerType.PLAYER_TWO, lane: 3 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers,
		} );
		store.dispatch(
			setPreview( {
				checkerId: 1,
				from: 13,
				options: [ { die: 3, to: 10 } ],
			} )
		);
		// 8-3=5 and 8-5=3 are both blocked.
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 2,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().notice.message ).toBe(
			MessageType.TARGET_OCCUPIED_BY_OPPONENT
		);
		expect( store.getState().preview ).toBe( null );
	} );

	it( 'a bear-off reachable with both dice uses the smaller die', () => {
		// P1 all home: 4-point checker can bear off with a 5 or a 6.
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 4 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 2 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 12 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 5, 6 ],
			checkers,
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().preview?.options ).toEqual( [
			{ die: 6, to: 25 },
			{ die: 5, to: 25 },
		] );
		confirmPreview( store.dispatch, store.getState(), 25 );
		expect( store.getState().dice ).toEqual( [ 6 ] );
		expect( store.getState().checkers[ 0 ].lane ).toBe( 25 );
	} );
} );

describe( 'reducer: preview lifecycle', () => {
	it( 'setting dice clears the preview', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
		} );
		store.dispatch(
			setPreview( {
				checkerId: 1,
				from: 13,
				options: [ { die: 3, to: 10 } ],
			} )
		);
		store.dispatch( setDice( [ 5 ] ) );
		expect( store.getState().preview ).toBe( null );
	} );

	it( 'handing over the turn clears the preview', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
		} );
		store.dispatch(
			setPreview( {
				checkerId: 1,
				from: 13,
				options: [ { die: 3, to: 10 } ],
			} )
		);
		store.dispatch( toggleCurrentPlayer( PlayerType.PLAYER_ONE ) );
		expect( store.getState().preview ).toBe( null );
	} );
} );

describe( 'advanced mode: select a die, then click a checker', () => {
	const position = () =>
		makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 1 },
		] );

	it( 'getEffectiveDie prefers the selection and falls back to a lone playable die', () => {
		expect(
			getEffectiveDie( {
				dice: [ 3, 5 ],
				selectedDie: 5,
				playableDice: [ 3, 5 ],
			} )
		).toBe( 5 );
		expect(
			getEffectiveDie( {
				dice: [ 3 ],
				selectedDie: 5,
				playableDice: [ 3 ],
			} )
		).toBe( 3 );
		expect(
			getEffectiveDie( {
				dice: [ 3, 5 ],
				selectedDie: null,
				playableDice: [ 3, 5 ],
			} )
		).toBe( null );
	} );

	it( 'asks for a die when two are playable and none is selected', () => {
		const store = createTestStore( {
			mode: 'advanced',
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		handleDirectMove( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().notice.message ).toBe(
			MessageType.SELECT_DIE_FIRST
		);
		expect( lanesOf( store.getState().checkers ) ).toEqual( [ 13, 24, 1 ] );
	} );

	it( 'moves immediately with the selected die, no preview', () => {
		const store = createTestStore( {
			mode: 'advanced',
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		store.dispatch( selectDie( 5 ) );
		handleDirectMove( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		const state = store.getState();
		expect( lanesOf( state.checkers ) ).toEqual( [ 8, 24, 1 ] );
		expect( state.dice ).toEqual( [ 3 ] );
		expect( state.preview ).toBe( null );
		expect( state.selectedDie ).toBe( null ); // 5 is used up
	} );

	it( 'uses the only playable die without an explicit selection', () => {
		const store = createTestStore( {
			mode: 'advanced',
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 4, 4, 4, 4 ],
			checkers: position(),
		} );
		handleDirectMove( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().checkers[ 0 ].lane ).toBe( 9 );
		expect( store.getState().dice ).toEqual( [ 4, 4, 4 ] );
	} );

	it( 'switching mode clears the selection and preview, restart keeps the mode', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		store.dispatch(
			setPreview( {
				checkerId: 1,
				from: 13,
				options: [ { die: 3, to: 10 } ],
			} )
		);
		store.dispatch( setMode( 'advanced' ) );
		expect( store.getState().mode ).toBe( 'advanced' );
		expect( store.getState().preview ).toBe( null );
		store.dispatch( selectDie( 3 ) );
		store.dispatch( setMode( 'beginner' ) );
		expect( store.getState().selectedDie ).toBe( null );
		store.dispatch( setMode( 'advanced' ) );
		store.dispatch( restartGame() );
		expect( store.getState().mode ).toBe( 'advanced' );
	} );
} );
