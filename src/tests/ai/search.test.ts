import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { evaluateBackgammon } from '../../ai/features/backgammon';
import { candidateTurns, finalCheckers, onePly, twoPly } from '../../ai/search';
import { getEngine } from '../../engine';
import { createGame, openingRoll, play } from '../../engine/game';
import type { Checker, GameState, Turn } from '../../engine/types';
import { P1, P2, stateWith } from '../engine/fixtures';

const backgammon = getEngine( 'backgammon' );
const key = ( checkers: Checker[] ) =>
	[ P1, P2 ].map( ( p ) => checkers.filter( ( c ) => c.player === p ).map( ( c ) => c.lane ).sort( ( a, b ) => a - b ).join( ',' ) ).join( '|' );

/** Replays a turn through the real engine; throws if any step is illegal. */
const replay = ( state: GameState, turn: Turn ) => turn.reduce( ( s, step ) => play( s, step ), state );

const start = ( dice: number[] ) =>
	stateWith( { checkers: backgammon.initialCheckers(), player: P1, dice, roll: [ dice[ 0 ], dice[ dice.length - 1 ] ] } );

describe( 'search', () => {
	it( 'candidate turns cover exactly the distinct final positions of the legal turns, doubles included', () => {
		const lanes = fc.array( fc.integer( { min: 1, max: 24 } ), { minLength: 15, maxLength: 15 } );
		fc.assert(
			fc.property( lanes, fc.integer( { min: 1, max: 6 } ), ( p1Lanes, die ) => {
				const checkers: Checker[] = [
					...p1Lanes.map( ( lane, i ) => ( { id: i + 1, player: P1, lane } ) ),
					...Array.from( { length: 15 }, ( _, i ) => ( { id: i + 16, player: P2, lane: 25 } ) ),
				];
				const state = stateWith( { checkers, player: P1, dice: [ die, die, die, die ], roll: [ die, die ] } );
				const expected = new Set( backgammon.legalTurns( state ).map( ( t ) => key( finalCheckers( state, t ) ) ) );
				const got = new Set( candidateTurns( state, evaluateBackgammon ).map( ( t ) => key( finalCheckers( state, t ) ) ) );
				expect( got ).toEqual( expected );
			} ),
			{ numRuns: 30 }
		);
	} );

	it( 'onePly returns legal turns, best first', () => {
		const state = start( [ 3, 1 ] );
		const ranked = onePly( state, evaluateBackgammon );
		expect( ranked.length ).toBeGreaterThan( 5 );
		for ( let i = 1; i < ranked.length; i++ ) expect( ranked[ i - 1 ].score ).toBeGreaterThanOrEqual( ranked[ i ].score );
		for ( const { turn } of ranked ) expect( () => replay( state, turn ) ).not.toThrow();
		// 3-1 from the start: making the 5-point (8/5 6/5) is the textbook play.
		const best = ranked[ 0 ].turn.map( ( s ) => `${ s.from }/${ s.to }` ).sort();
		expect( best ).toEqual( [ '6/5', '8/5' ] );
	} );

	it( 'twoPly on a double from the start finishes quickly and returns a legal turn', () => {
		const state = start( [ 4, 4, 4, 4 ] );
		const started = performance.now();
		const ranked = twoPly( state, evaluateBackgammon, { topN: 8 } );
		expect( performance.now() - started ).toBeLessThan( 1500 );
		expect( ranked.length ).toBeGreaterThan( 0 );
		expect( () => replay( state, ranked[ 0 ].turn ) ).not.toThrow();
	} );

	it( 'returns no turns when nothing can be played', () => {
		let g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		g = { ...g, dice: [] };
		expect( onePly( g, evaluateBackgammon ) ).toEqual( [] );
	} );

	it( 'searches an eight-die tric trac in Triktrak quickly, with a legal result', () => {
		const triktrak = getEngine( 'triktrak' );
		const state = stateWith( {
			variant: 'triktrak',
			checkers: triktrak.initialCheckers(),
			waiting: { [ P1 ]: 15, [ P2 ]: 15 },
			player: P1,
			roll: [ 1, 2 ],
			dice: triktrak.expandRoll( [ 1, 2 ], state0Options() ),
		} );
		const started = performance.now();
		const ranked = onePly( state, evaluateBackgammon );
		expect( performance.now() - started ).toBeLessThan( 1000 );
		expect( ranked[ 0 ].turn ).toHaveLength( 8 );
		expect( () => replay( state, ranked[ 0 ].turn ) ).not.toThrow();
	} );
} );

function state0Options() {
	return createGame( 'triktrak' ).options;
}
