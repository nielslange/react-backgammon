import { describe, expect, it } from 'vitest';
import { makeStore } from '../../data/createStore';
import {
	configureSession,
	gameEnded,
	isCrawfordPending,
	isCubeAllowed,
	isMatchOver,
	nextGame,
} from '../../data/sessionSlice';
import { P1, P2 } from '../engine/fixtures';

const scores = ( p1: number, p2: number ) => ( { [ P1 ]: p1, [ P2 ]: p2 } );

const twoHumans = {
	[ P1 ]: { kind: 'human' as const, name: 'Niels' },
	[ P2 ]: { kind: 'human' as const, name: 'Guest' },
};

describe( 'match helpers', () => {
	it( 'isMatchOver when either player reaches the target, also past it', () => {
		expect( isMatchOver( scores( 5, 3 ), 5 ) ).toBe( true );
		expect( isMatchOver( scores( 3, 5 ), 5 ) ).toBe( true );
		expect( isMatchOver( scores( 6, 2 ), 5 ) ).toBe( true );
		expect( isMatchOver( scores( 4, 3 ), 5 ) ).toBe( false );
	} );
	it( 'isCrawfordPending when either player is at target - 1', () => {
		expect( isCrawfordPending( scores( 4, 2 ), 5 ) ).toBe( true );
		expect( isCrawfordPending( scores( 2, 4 ), 5 ) ).toBe( true );
		expect( isCrawfordPending( scores( 3, 2 ), 5 ) ).toBe( false );
		expect( isCrawfordPending( scores( 5, 2 ), 5 ) ).toBe( false );
	} );
	it( 'the cube is disallowed in the Crawford game only', () => {
		expect( isCubeAllowed( scores( 4, 2 ), 5, false ) ).toBe( false );
		expect( isCubeAllowed( scores( 4, 2 ), 5, true ) ).toBe( true );
		expect( isCubeAllowed( scores( 3, 2 ), 5, false ) ).toBe( true );
	} );
} );

describe( 'sessionSlice', () => {
	it( 'configureSession sets seats and target and resets the score', () => {
		const store = makeStore();
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 5 } ) );
		const s = store.getState().session;
		expect( s.players[ P1 ].name ).toBe( 'Niels' );
		expect( s.matchTarget ).toBe( 5 );
		expect( s.scores ).toEqual( scores( 0, 0 ) );
		expect( s.crawfordPlayed ).toBe( false );
		expect( s.gameNumber ).toBe( 1 );
	} );

	it( 'gameEnded adds the points to the winner', () => {
		const store = makeStore();
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 5 } ) );
		store.dispatch( gameEnded( { winner: P2, points: 2 } ) );
		expect( store.getState().session.scores ).toEqual( scores( 0, 2 ) );
	} );

	it( 'gameEnded with no winner (draw) changes nothing', () => {
		const store = makeStore();
		store.dispatch( gameEnded( { winner: null, points: 0 } ) );
		expect( store.getState().session.scores ).toEqual( scores( 0, 0 ) );
	} );

	it( 'gameEnded sets crawfordPlayed when a player had match point minus one', () => {
		const store = makeStore();
		store.dispatch( configureSession( { players: twoHumans, matchTarget: 5 } ) );
		store.dispatch( gameEnded( { winner: P1, points: 2 } ) );
		store.dispatch( gameEnded( { winner: P1, points: 2 } ) ); // 4-0: Crawford pending
		expect( store.getState().session.crawfordPlayed ).toBe( false );
		store.dispatch( gameEnded( { winner: P2, points: 1 } ) ); // the Crawford game
		expect( store.getState().session.scores ).toEqual( scores( 4, 1 ) );
		expect( store.getState().session.crawfordPlayed ).toBe( true );
	} );

	it( 'nextGame increments the game number', () => {
		const store = makeStore();
		store.dispatch( nextGame() );
		expect( store.getState().session.gameNumber ).toBe( 2 );
	} );
} );
