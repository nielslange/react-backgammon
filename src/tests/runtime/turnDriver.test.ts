import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../../data/createStore';
import { loadSnapshot, newGame, playStep } from '../../data/gameSlice';
import { selectLegalSteps, selectNotice } from '../../data/selectors';
import { MessageType } from '../../types';
import { configureSession } from '../../data/sessionSlice';
import { setMode } from '../../data/uiSlice';
import { rollDie, scripted, seeded } from '../../runtime/rng';
import { createTurnDriver } from '../../runtime/turnDriver';
import { P1, P2, pos } from '../engine/fixtures';

const DELAYS = { roll: 400, aiStep: 350 };

const storeWith = ( dice: number[] ) =>
	makeStore( {
		middleware: [
			createTurnDriver( { rng: scripted( dice ), delays: DELAYS } ).middleware,
		],
	} );

const twoHumans = {
	[ P1 ]: { kind: 'human' as const, name: 'Blue' },
	[ P2 ]: { kind: 'human' as const, name: 'Red' },
};

describe( 'rng', () => {
	it( 'seeded is deterministic and rollDie stays within 1..6', () => {
		const a = seeded( 42 );
		const b = seeded( 42 );
		const rollsA = Array.from( { length: 20 }, () => rollDie( a ) );
		const rollsB = Array.from( { length: 20 }, () => rollDie( b ) );
		expect( rollsA ).toEqual( rollsB );
		expect( rollsA.every( ( d ) => d >= 1 && d <= 6 ) ).toBe( true );
		expect( new Set( rollsA ).size ).toBeGreaterThan( 1 );
	} );
	it( 'scripted returns the given dice in order', () => {
		const rng = scripted( [ 6, 1, 3 ] );
		expect( [ rollDie( rng ), rollDie( rng ), rollDie( rng ) ] ).toEqual( [ 6, 1, 3 ] );
	} );
} );

describe( 'turnDriver', () => {
	beforeEach( () => vi.useFakeTimers() );
	afterEach( () => vi.useRealTimers() );

	it( 'does nothing before a game is started', () => {
		const store = storeWith( [ 6, 1 ] );
		store.dispatch( setMode( 'advanced' ) );
		expect( store.getState().game.state.phase ).toBe( 'idle' );
	} );

	it( 'performs the opening roll until the tie is broken', () => {
		const store = storeWith( [ 4, 4, 2, 5 ] );
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 1 } ) );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const game = store.getState().game.state;
		expect( game.phase ).toBe( 'moving' );
		expect( game.player ).toBe( P2 );
		expect( game.roll ).toEqual( [ 2, 5 ] );
		expect( game.dice ).toEqual( [ 5, 2 ] );
	} );

	it( 'auto-rolls for the next player after a hand-off', async () => {
		const store = storeWith( [ 6, 1, 4, 4 ] );
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 1 } ) );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const first = selectLegalSteps( store.getState() ).find(
			( s ) => s.from === 13 && s.die === 6
		)!;
		store.dispatch( playStep( { step: first } ) );
		const second = selectLegalSteps( store.getState() ).find(
			( s ) => s.from === 8 && s.die === 1
		)!;
		store.dispatch( playStep( { step: second } ) );
		expect( store.getState().game.state.phase ).toBe( 'awaiting-roll' );
		expect( store.getState().game.state.dice ).toEqual( [] );

		await vi.advanceTimersByTimeAsync( DELAYS.roll - 1 );
		expect( store.getState().game.state.dice ).toEqual( [] );
		await vi.advanceTimersByTimeAsync( 1 );
		expect( store.getState().game.state.player ).toBe( P2 );
		expect( store.getState().game.state.dice ).toEqual( [ 4, 4, 4, 4 ] );
	} );

	it( 'does not roll for a remote seat and skips the opening roll with one', async () => {
		const store = storeWith( [ 6, 1, 4, 4 ] );
		store.dispatch(
			configureSession( {
				players: {
					[ P1 ]: { kind: 'human', name: 'Blue' },
					[ P2 ]: { kind: 'remote', name: 'Far away' },
				},
				matchTarget: 1,
			} )
		);
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		expect( store.getState().game.state.phase ).toBe( 'opening' );

		const snapshot = {
			...store.getState().game.state,
			phase: 'awaiting-roll' as const,
			player: P2,
			firstMover: P1,
		};
		store.dispatch( loadSnapshot( { snapshot } ) );
		await vi.advanceTimersByTimeAsync( DELAYS.roll * 2 );
		expect( store.getState().game.state.dice ).toEqual( [] );
		expect( store.getState().game.state.phase ).toBe( 'awaiting-roll' );
	} );

	it( 'rolls again for the opponent when a roll is forfeited', async () => {
		// P2 to roll; whatever P2 plays, P1 then sits on the bar behind a
		// closed board and forfeits, so P2 rolls once more.
		const store = storeWith( [ 2, 1, 3, 3 ] );
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 1 } ) );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P1, lane: 12, count: 14 },
			{ player: P2, lane: 19, count: 2 },
			{ player: P2, lane: 20, count: 2 },
			{ player: P2, lane: 21, count: 2 },
			{ player: P2, lane: 22, count: 2 },
			{ player: P2, lane: 23, count: 2 },
			{ player: P2, lane: 24, count: 2 },
			{ player: P2, lane: 10, count: 3 },
		] );
		store.dispatch(
			loadSnapshot( {
				snapshot: {
					...store.getState().game.state,
					checkers,
					phase: 'awaiting-roll' as const,
					player: P1,
					firstMover: P1,
				},
			} )
		);
		await vi.advanceTimersByTimeAsync( DELAYS.roll );
		// P1 rolled 2-1, could not enter: turn passed to P2.
		const afterForfeit = store.getState().game.state;
		expect( afterForfeit.player ).toBe( P2 );
		expect( afterForfeit.lastEvent ).toBe( 'forfeit' );
		expect( afterForfeit.phase ).toBe( 'awaiting-roll' );
		await vi.advanceTimersByTimeAsync( DELAYS.roll );
		expect( store.getState().game.state.player ).toBe( P2 );
		expect( store.getState().game.state.dice ).toEqual( [ 3, 3, 3, 3 ] );
	} );

	it( 'reports the result to the session when the game ends', () => {
		const store = storeWith( [ 6, 1 ] );
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 5 } ) );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const checkers = pos( [
			{ player: P1, lane: 25, count: 14 },
			{ player: P1, lane: 3, count: 1 },
			{ player: P2, lane: 12, count: 15 },
		] );
		store.dispatch(
			loadSnapshot( {
				snapshot: {
					...store.getState().game.state,
					checkers,
					phase: 'moving' as const,
					player: P1,
					roll: [ 3, 1 ] as [ number, number ],
					dice: [ 3 ],
				},
			} )
		);
		const step = selectLegalSteps( store.getState() )[ 0 ];
		store.dispatch( playStep( { step } ) );
		expect( store.getState().game.state.phase ).toBe( 'over' );
		expect( store.getState().session.scores ).toEqual( { [ P1 ]: 2, [ P2 ]: 0 } );
	} );
} );

describe( 'turnDriver notices', () => {
	beforeEach( () => vi.useFakeTimers() );
	afterEach( () => vi.useRealTimers() );

	it( 'keeps telling the player that the previous roll was forfeited after the auto-roll', async () => {
		const store = storeWith( [ 2, 1, 3, 3 ] );
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 1 } ) );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P1, lane: 12, count: 14 },
			{ player: P2, lane: 19, count: 2 },
			{ player: P2, lane: 20, count: 2 },
			{ player: P2, lane: 21, count: 2 },
			{ player: P2, lane: 22, count: 2 },
			{ player: P2, lane: 23, count: 2 },
			{ player: P2, lane: 24, count: 2 },
			{ player: P2, lane: 10, count: 3 },
		] );
		store.dispatch(
			loadSnapshot( {
				snapshot: {
					...store.getState().game.state,
					checkers,
					phase: 'awaiting-roll' as const,
					player: P1,
					firstMover: P1,
				},
			} )
		);
		await vi.advanceTimersByTimeAsync( DELAYS.roll );
		await vi.advanceTimersByTimeAsync( DELAYS.roll );
		expect( store.getState().game.state.dice ).toEqual( [ 3, 3, 3, 3 ] );
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.OPPONENT_FORFEITED );
	} );
} );
