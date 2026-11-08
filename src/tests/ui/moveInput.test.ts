/**
 * Click flows on top of the engine:
 *  - beginner: click a checker, its landing points light up, click one
 *  - advanced: pick a die, a checker click moves at once
 */
import { describe, expect, it } from 'vitest';
import { makeStore, type AppStore } from '../../data/createStore';
import { loadSnapshot, newGame } from '../../data/gameSlice';
import { selectNotice } from '../../data/selectors';
import { selectDie, setMode, setPreview } from '../../data/uiSlice';
import type { Checker, Player } from '../../engine/types';
import { MessageType } from '../../types';
import {
	effectiveDie,
	onCheckerClick,
	onTargetClick,
	optionsForChecker,
	playableDice,
} from '../../ui/moveInput';
import { P1, P2 } from '../engine/fixtures';

/** Pad each side to 15 checkers on its off lane (ids from 100 up). */
const padded = ( checkers: Checker[] ): Checker[] => {
	let id = 100;
	const pad = ( player: Player, off: number ) =>
		Array.from(
			{ length: 15 - checkers.filter( ( c ) => c.player === player ).length },
			() => ( { id: id++, player, lane: off } )
		);
	return [ ...checkers, ...pad( P1, 25 ), ...pad( P2, 0 ) ];
};

const withPosition = (
	store: AppStore,
	{ checkers, player, dice }: { checkers: Checker[]; player: Player; dice: number[] }
) => {
	store.dispatch( newGame( { variant: 'backgammon' } ) );
	store.dispatch(
		loadSnapshot( {
			snapshot: {
				...store.getState().game.state,
				checkers: padded( checkers ),
				phase: 'moving',
				player,
				firstMover: player,
				roll: [ dice[ 0 ], dice[ dice.length - 1 ] ],
				dice,
			},
		} )
	);
	return store;
};

const lanesOf = ( store: AppStore, ids: number[] ) =>
	ids.map( ( id ) => store.getState().game.state.checkers.find( ( c ) => c.id === id )!.lane );

const position = (): Checker[] => [
	{ id: 1, player: P1, lane: 13 },
	{ id: 2, player: P1, lane: 24 },
	{ id: 3, player: P2, lane: 1 },
];

const click = ( store: AppStore, id: number ) =>
	onCheckerClick( store.dispatch, store.getState(), id );
const target = ( store: AppStore, lane: number ) =>
	onTargetClick( store.dispatch, store.getState(), lane );

describe( 'optionsForChecker and playableDice', () => {
	it( 'returns one landing point per playable die, larger die first', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		expect(
			optionsForChecker( store.getState(), 1 ).map( ( o ) => [ o.die, o.to ] )
		).toEqual( [
			[ 5, 8 ],
			[ 3, 10 ],
		] );
	} );
	it( 'is empty for the opponent checker and outside the moving phase', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		expect( optionsForChecker( store.getState(), 3 ) ).toEqual( [] );
		expect( optionsForChecker( makeStore().getState(), 1 ) ).toEqual( [] );
	} );
	it( 'playableDice lists distinct values, collapses doubles, honours the larger-die rule', () => {
		const open = withPosition( makeStore(), {
			checkers: [ { id: 1, player: P1, lane: 13 } ],
			player: P1,
			dice: [ 3, 5 ],
		} );
		expect( playableDice( open.getState() ) ).toEqual( [ 5, 3 ] );

		const doubles = withPosition( makeStore(), {
			checkers: [ { id: 1, player: P1, lane: 13 } ],
			player: P1,
			dice: [ 4, 4, 4, 4 ],
		} );
		expect( playableDice( doubles.getState() ) ).toEqual( [ 4 ] );

		// P1 on 8: 8-3=5 is blocked, 8-5=3 is open.
		const blocked = withPosition( makeStore(), {
			checkers: [
				{ id: 1, player: P1, lane: 8 },
				{ id: 2, player: P2, lane: 5 },
				{ id: 3, player: P2, lane: 5 },
			],
			player: P1,
			dice: [ 3, 5 ],
		} );
		expect( playableDice( blocked.getState() ) ).toEqual( [ 5 ] );
		expect( playableDice( makeStore().getState() ) ).toEqual( [] );
	} );
} );

describe( 'beginner mode', () => {
	it( 'previews both landing points on the first click', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 1 );
		const preview = store.getState().ui.preview!;
		expect( preview.checkerId ).toBe( 1 );
		expect( preview.options.map( ( o ) => o.to ) ).toEqual( [ 8, 10 ] );
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.PREVIEW_MOVE );
		expect( lanesOf( store, [ 1, 2, 3 ] ) ).toEqual( [ 13, 24, 1 ] );
	} );

	it( 'clicking a landing point moves the checker with that die', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 1 );
		target( store, 10 );
		expect( lanesOf( store, [ 1, 2, 3 ] ) ).toEqual( [ 10, 24, 1 ] );
		expect( store.getState().game.state.dice ).toEqual( [ 5 ] );
		expect( store.getState().ui.preview ).toBeNull();
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.MOVE_CHECKER );
	} );

	it( 'ignores a click on a point that is not an option', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 1 );
		target( store, 9 );
		expect( lanesOf( store, [ 1 ] ) ).toEqual( [ 13 ] );
		expect( store.getState().ui.preview?.checkerId ).toBe( 1 );
	} );

	it( 'a second click on the checker moves it when only one option exists', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 5 ],
		} );
		click( store, 1 );
		expect( store.getState().ui.preview?.options.map( ( o ) => o.to ) ).toEqual( [ 8 ] );
		click( store, 1 );
		expect( lanesOf( store, [ 1 ] ) ).toEqual( [ 8 ] );
		// Last die used: the turn was handed over.
		expect( store.getState().game.state.player ).toBe( P2 );
		expect( store.getState().game.state.phase ).toBe( 'awaiting-roll' );
	} );

	it( 'clicking an own checker on a highlighted point moves there', () => {
		const store = withPosition( makeStore(), {
			checkers: [
				{ id: 1, player: P1, lane: 13 },
				{ id: 2, player: P1, lane: 8 },
				{ id: 3, player: P1, lane: 8 },
				{ id: 4, player: P2, lane: 1 },
			],
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 1 );
		click( store, 2 );
		expect( lanesOf( store, [ 1, 2, 3 ] ) ).toEqual( [ 8, 8, 8 ] );
		expect( store.getState().game.state.dice ).toEqual( [ 3 ] );
		expect( store.getState().ui.preview ).toBeNull();
	} );

	it( "clicking the opponent's blot on a highlighted point hits it", () => {
		const store = withPosition( makeStore(), {
			checkers: [
				{ id: 1, player: P1, lane: 13 },
				{ id: 2, player: P2, lane: 10 },
			],
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 1 );
		click( store, 2 );
		expect( lanesOf( store, [ 1, 2 ] ) ).toEqual( [ 10, 25 ] );
		expect( selectNotice( store.getState() ).message ).toBe(
			MessageType.MOVE_CHECKER_AND_HIT
		);
	} );

	it( 'switching checkers replaces the preview instead of moving', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 1 );
		click( store, 2 );
		expect( store.getState().ui.preview?.checkerId ).toBe( 2 );
		expect( store.getState().ui.preview?.options.map( ( o ) => o.to ) ).toEqual( [ 19, 21 ] );
		expect( lanesOf( store, [ 1, 2 ] ) ).toEqual( [ 13, 24 ] );
	} );

	it( 'a checker without legal moves shows why and clears the preview', () => {
		const store = withPosition( makeStore(), {
			checkers: [
				{ id: 1, player: P1, lane: 13 },
				{ id: 2, player: P1, lane: 8 },
				{ id: 3, player: P2, lane: 5 },
				{ id: 4, player: P2, lane: 5 },
				{ id: 5, player: P2, lane: 3 },
				{ id: 6, player: P2, lane: 3 },
			],
			player: P1,
			dice: [ 3, 5 ],
		} );
		store.dispatch( setPreview( { checkerId: 1, options: [] } ) );
		click( store, 2 );
		expect( selectNotice( store.getState() ).message ).toBe(
			MessageType.TARGET_OCCUPIED_BY_OPPONENT
		);
		expect( store.getState().ui.preview ).toBeNull();
	} );

	it( 'a bear-off reachable with both dice uses the smaller die', () => {
		const store = withPosition( makeStore(), {
			checkers: [
				{ id: 1, player: P1, lane: 4 },
				{ id: 2, player: P1, lane: 2 },
				{ id: 3, player: P2, lane: 12 },
			],
			player: P1,
			dice: [ 5, 6 ],
		} );
		click( store, 1 );
		expect( store.getState().ui.preview?.options.map( ( o ) => [ o.die, o.to ] ) ).toEqual( [
			[ 6, 25 ],
			[ 5, 25 ],
		] );
		target( store, 25 );
		expect( lanesOf( store, [ 1 ] ) ).toEqual( [ 25 ] );
		expect( store.getState().game.state.dice ).toEqual( [ 6 ] );
	} );
} );

describe( 'guards', () => {
	it( 'rejects clicking before the game has started', () => {
		const store = makeStore();
		click( store, 1 );
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.ROLL_DICE_FIRST );
	} );
	it( "rejects clicking the opponent's checker", () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 3 );
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.NOT_YOUR_CHECKER );
	} );
	it( 'insists on the bar checker first', () => {
		const store = withPosition( makeStore(), {
			checkers: [
				{ id: 1, player: P1, lane: 0 },
				{ id: 2, player: P1, lane: 13 },
			],
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 2 );
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.WAITING_CHECKER );
		click( store, 1 );
		expect( store.getState().ui.preview?.checkerId ).toBe( 1 );
	} );
	it( 'explains a bear-off attempt with a checker still outside', () => {
		const store = withPosition( makeStore(), {
			checkers: [
				{ id: 1, player: P1, lane: 2 },
				{ id: 2, player: P1, lane: 13 },
				{ id: 3, player: P2, lane: 6 },
				{ id: 4, player: P2, lane: 6 },
			],
			player: P1,
			dice: [ 6, 6, 6, 6 ],
		} );
		click( store, 1 );
		expect( selectNotice( store.getState() ).message ).toBe(
			MessageType.NOT_ALL_CHECKERS_IN_END_ZONE
		);
	} );
} );

describe( 'advanced mode', () => {
	it( 'effectiveDie prefers the selection and falls back to a lone playable die', () => {
		const store = withPosition( makeStore(), {
			checkers: [ { id: 1, player: P1, lane: 13 } ],
			player: P1,
			dice: [ 3, 5 ],
		} );
		store.dispatch( setMode( 'advanced' ) );
		expect( effectiveDie( store.getState() ) ).toBeNull();
		store.dispatch( selectDie( 3 ) );
		expect( effectiveDie( store.getState() ) ).toBe( 3 );
		const lone = withPosition( makeStore(), {
			checkers: [ { id: 1, player: P1, lane: 13 } ],
			player: P1,
			dice: [ 5 ],
		} );
		lone.dispatch( setMode( 'advanced' ) );
		expect( effectiveDie( lone.getState() ) ).toBe( 5 );
	} );

	it( 'asks for a die when two are playable and none is selected', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		store.dispatch( setMode( 'advanced' ) );
		click( store, 1 );
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.SELECT_DIE_FIRST );
		expect( lanesOf( store, [ 1 ] ) ).toEqual( [ 13 ] );
	} );

	it( 'moves immediately with the selected die, no preview', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		store.dispatch( setMode( 'advanced' ) );
		store.dispatch( selectDie( 3 ) );
		click( store, 1 );
		expect( lanesOf( store, [ 1 ] ) ).toEqual( [ 10 ] );
		expect( store.getState().game.state.dice ).toEqual( [ 5 ] );
		expect( store.getState().ui.preview ).toBeNull();
	} );

	it( 'uses the only playable die without an explicit selection', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 5 ],
		} );
		store.dispatch( setMode( 'advanced' ) );
		click( store, 1 );
		expect( lanesOf( store, [ 1 ] ) ).toEqual( [ 8 ] );
	} );

	it( 'switching mode clears the selection and preview', () => {
		const store = withPosition( makeStore(), {
			checkers: position(),
			player: P1,
			dice: [ 3, 5 ],
		} );
		click( store, 1 );
		expect( store.getState().ui.preview ).not.toBeNull();
		store.dispatch( setMode( 'advanced' ) );
		expect( store.getState().ui.preview ).toBeNull();
		store.dispatch( selectDie( 3 ) );
		store.dispatch( setMode( 'beginner' ) );
		expect( store.getState().ui.selectedDie ).toBeNull();
	} );
} );
