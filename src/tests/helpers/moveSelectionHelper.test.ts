/**
 * Select-die → preview → confirm flow.
 */
import { describe, it, expect } from 'vitest';
import {
	confirmPreview,
	getEffectiveDie,
	getPlayableDice,
	handleCheckerSelection,
} from '../../helpers/moveSelectionHelper';
import { resolveMove } from '../../helpers/handleClickHelper';
import {
	selectDie,
	setDice,
	setPreview,
	toggleCurrentPlayer,
} from '../../data/actions';
import { MessageType, PlayerType } from '../../types';
import { createTestStore, makeCheckers } from '../integration/test-utils';

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

describe( 'getEffectiveDie', () => {
	it( 'uses the selected die while it is still available', () => {
		expect(
			getEffectiveDie( {
				dice: [ 3, 5 ],
				selectedDie: 5,
				playableDice: [ 3, 5 ],
			} )
		).toBe( 5 );
	} );

	it( 'drops a selected die that has been used up', () => {
		expect(
			getEffectiveDie( {
				dice: [ 3 ],
				selectedDie: 5,
				playableDice: [ 3 ],
			} )
		).toBe( 3 );
	} );

	it( 'auto-selects the only playable die', () => {
		expect(
			getEffectiveDie( {
				dice: [ 4, 4, 4 ],
				selectedDie: null,
				playableDice: [ 4 ],
			} )
		).toBe( 4 );
	} );

	it( 'returns null when the player still has to choose', () => {
		expect(
			getEffectiveDie( {
				dice: [ 3, 5 ],
				selectedDie: null,
				playableDice: [ 3, 5 ],
			} )
		).toBe( null );
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
		expect( checkers[ 0 ].lane ).toBe( 13 );
		expect( checkers[ 1 ].lane ).toBe( 8 );
	} );
} );

describe( 'handleCheckerSelection', () => {
	const position = () =>
		makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 1 },
		] );

	it( 'asks for a die when two are playable and none is selected', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().notice.message ).toBe(
			MessageType.SELECT_DIE_FIRST
		);
		expect( store.getState().preview ).toBe( null );
	} );

	it( 'previews on the first click and moves on the second', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		store.dispatch( selectDie( 5 ) );

		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().preview ).toEqual( {
			checkerId: 1,
			from: 13,
			to: 8,
			die: 5,
		} );
		expect( store.getState().notice.message ).toBe(
			MessageType.PREVIEW_MOVE
		);
		expect( store.getState().checkers[ 0 ].lane ).toBe( 13 );

		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		const state = store.getState();
		expect( state.checkers[ 0 ].lane ).toBe( 8 );
		expect( state.dice ).toEqual( [ 3 ] );
		expect( state.preview ).toBe( null );
		expect( state.notice.message ).toBe( MessageType.MOVE_CHECKER );
	} );

	it( 'switching checkers replaces the preview instead of moving', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		store.dispatch( selectDie( 3 ) );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 2,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().preview?.checkerId ).toBe( 2 );
		expect( store.getState().preview?.to ).toBe( 21 );
		expect(
			store.getState().checkers.map( ( c: { lane: number } ) => c.lane )
		).toEqual( [ 13, 24, 1 ] );
	} );

	it( 'rejects an illegal move and clears the preview', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 8 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 5 },
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 5 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers,
			preview: { checkerId: 1, from: 13, to: 10, die: 3 },
		} );
		store.dispatch(
			setPreview( { checkerId: 1, from: 13, to: 10, die: 3 } )
		);
		store.dispatch( selectDie( 3 ) );
		// 8 - 3 = 5 is blocked.
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 2,
			player: PlayerType.PLAYER_ONE,
		} );
		expect( store.getState().notice.message ).toBe(
			MessageType.TARGET_OCCUPIED_BY_OPPONENT
		);
		expect( store.getState().preview ).toBe( null );
	} );

	it( 'confirmPreview commits the previewed move from a lane click', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers: position(),
		} );
		store.dispatch( selectDie( 5 ) );
		handleCheckerSelection( store.dispatch, store.getState(), {
			id: 1,
			player: PlayerType.PLAYER_ONE,
		} );
		confirmPreview( store.dispatch, store.getState() );
		expect( store.getState().checkers[ 0 ].lane ).toBe( 8 );
		expect( store.getState().dice ).toEqual( [ 3 ] );
	} );
} );

describe( 'reducer: die selection and preview', () => {
	it( 'selecting a die clears the preview', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
		} );
		store.dispatch(
			setPreview( { checkerId: 1, from: 13, to: 10, die: 3 } )
		);
		store.dispatch( selectDie( 5 ) );
		expect( store.getState().selectedDie ).toBe( 5 );
		expect( store.getState().preview ).toBe( null );
	} );

	it( 'setting dice keeps a still-available selection and drops a used one', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
		} );
		store.dispatch( selectDie( 5 ) );
		store.dispatch( setDice( [ 5 ] ) );
		expect( store.getState().selectedDie ).toBe( 5 );
		store.dispatch( setDice( [ 3 ] ) );
		expect( store.getState().selectedDie ).toBe( null );
	} );

	it( 'handing over the turn clears selection and preview', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
		} );
		store.dispatch( selectDie( 3 ) );
		store.dispatch(
			setPreview( { checkerId: 1, from: 13, to: 10, die: 3 } )
		);
		store.dispatch( toggleCurrentPlayer( PlayerType.PLAYER_ONE ) );
		expect( store.getState().selectedDie ).toBe( null );
		expect( store.getState().preview ).toBe( null );
	} );
} );
