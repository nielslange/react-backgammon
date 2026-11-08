import { describe, expect, it } from 'vitest';
import { makeStore } from '../../data/createStore';
import {
	loadSnapshot,
	newGame,
	openingRoll,
	playStep,
	resign,
	roll,
	undoStep,
} from '../../data/gameSlice';
import { backgammon } from '../../engine/backgammon';
import { P1, P2, pos } from '../engine/fixtures';

describe( 'gameSlice', () => {
	it( 'starts a new game in the opening phase', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		expect( store.getState().game.state.phase ).toBe( 'opening' );
		expect( store.getState().game.lastError ).toBeNull();
	} );

	it( 'runs an opening roll and a step through the engine', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
		const game = store.getState().game.state;
		expect( game.player ).toBe( P1 );
		const step = backgammon
			.legalSteps( game )
			.find( ( s ) => s.from === 13 && s.die === 6 )!;
		store.dispatch( playStep( { step } ) );
		expect( store.getState().game.state.dice ).toEqual( [ 1 ] );
		expect( store.getState().game.lastError ).toBeNull();
	} );

	it( 'an illegal step leaves the game untouched and records the error', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
		const before = store.getState().game.state;
		store.dispatch(
			playStep( {
				step: { checkerId: 1, from: 24, to: 10, die: 14, hit: false },
			} )
		);
		expect( store.getState().game.state ).toBe( before );
		expect( store.getState().game.lastError ).toBe( 'ILLEGAL_STEP' );
	} );

	it( 'a later legal action clears the error', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch( undoStep() );
		expect( store.getState().game.lastError ).toBe( 'NOTHING_TO_UNDO' );
		store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
		expect( store.getState().game.lastError ).toBeNull();
	} );

	it( 'roll is rejected outside the awaiting-roll phase', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch( roll( { roll: [ 3, 2 ] } ) );
		expect( store.getState().game.lastError ).toBe( 'WRONG_PHASE' );
	} );

	it( 'resign ends the game for the opponent', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
		store.dispatch( resign( { player: P1 } ) );
		expect( store.getState().game.state.result ).toEqual( {
			winner: P2,
			points: 1,
			kind: 'resign',
		} );
	} );

	it( 'loading a snapshot with mixed points is rejected and the current game stays', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const before = store.getState().game.state;
		store.dispatch(
			loadSnapshot( {
				snapshot: {
					...before,
					checkers: pos( [
						{ player: P1, lane: 5, count: 1 },
						{ player: P1, lane: 24, count: 14 },
						{ player: P2, lane: 5, count: 1 },
						{ player: P2, lane: 1, count: 14 },
					] ),
				},
			} )
		);
		expect( store.getState().game.state ).toBe( before );
		expect( store.getState().game.lastError ).toBe( 'INVALID_POSITION' );
	} );

	it( 'loading a valid snapshot replaces the game', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const snapshot = {
			...store.getState().game.state,
			phase: 'moving' as const,
			player: P2,
			dice: [ 4, 2 ],
			roll: [ 4, 2 ] as [ number, number ],
		};
		store.dispatch( loadSnapshot( { snapshot } ) );
		expect( store.getState().game.state.player ).toBe( P2 );
		expect( store.getState().game.state.dice ).toEqual( [ 4, 2 ] );
	} );
} );
