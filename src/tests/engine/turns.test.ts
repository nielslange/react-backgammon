/**
 * Turn enumeration and the rules it enforces:
 *  - both dice must be played when any ordering allows it
 *  - when only one die can be played, it must be the larger
 *  - a checker on the bar must enter before anything else moves
 *  - bear-off only with all checkers home and the exact/overshoot rule
 */
import { describe, expect, it } from 'vitest';
import {
	legalSteps,
	legalTurns,
	stepsForDie,
} from '../../engine/backgammon/turns';
import startCheckers from '../../data/checkers-start.json';
import type { Checker } from '../../engine/types';
import { P1, P2, pos } from './fixtures';

const start = startCheckers as Checker[];

describe( 'stepsForDie', () => {
	it( 'offers one step per occupied lane and flags hits', () => {
		const checkers = pos( [
			{ player: P1, lane: 13, count: 2 },
			{ player: P1, lane: 8, count: 1 },
			{ player: P2, lane: 3, count: 1 },
		] );
		const steps = stepsForDie( checkers, P1, 5 );
		expect( steps.map( ( s ) => [ s.from, s.to, s.hit ] ) ).toEqual( [
			[ 13, 8, false ],
			[ 8, 3, true ],
		] );
	} );
	it( 'uses the highest id on the lane as checkerId', () => {
		const checkers = pos( [ { player: P1, lane: 13, count: 3 } ] );
		expect( stepsForDie( checkers, P1, 2 )[ 0 ].checkerId ).toBe( 3 );
	} );
	it( 'only the bar checker may move while one is on the bar', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P1, lane: 13, count: 2 },
		] );
		const steps = stepsForDie( checkers, P1, 3 );
		expect( steps ).toHaveLength( 1 );
		expect( steps[ 0 ] ).toMatchObject( { from: 0, to: 22 } );
	} );
	it( 'P2 entry is blocked by two P1 checkers', () => {
		const checkers = pos( [
			{ player: P2, lane: 25, count: 1 },
			{ player: P1, lane: 4, count: 2 },
		] );
		expect( stepsForDie( checkers, P2, 4 ) ).toEqual( [] );
		expect( stepsForDie( checkers, P2, 5 ) ).toHaveLength( 1 );
	} );
	it( 'bears off only when all checkers are home', () => {
		const outside = pos( [
			{ player: P1, lane: 6, count: 1 },
			{ player: P1, lane: 7, count: 1 },
		] );
		expect(
			stepsForDie( outside, P1, 6 ).some( ( s ) => s.to === 25 )
		).toBe( false );
		const home = pos( [
			{ player: P1, lane: 6, count: 1 },
			{ player: P1, lane: 2, count: 1 },
		] );
		expect( stepsForDie( home, P1, 6 ) ).toEqual( [
			{ checkerId: 1, from: 6, to: 25, die: 6, hit: false },
		] );
	} );
	it( 'does not offer a step onto a blocked point', () => {
		const checkers = pos( [
			{ player: P1, lane: 13, count: 1 },
			{ player: P2, lane: 8, count: 2 },
		] );
		expect( stepsForDie( checkers, P1, 5 ) ).toEqual( [] );
	} );
} );

describe( 'legalTurns', () => {
	it( 'plays both dice when both can be played', () => {
		const checkers = pos( [ { player: P1, lane: 24, count: 1 } ] );
		const turns = legalTurns( checkers, P1, [ 3, 5 ], false );
		expect( turns.length ).toBeGreaterThan( 0 );
		expect( turns.every( ( t ) => t.length === 2 ) ).toBe( true );
	} );
	it( 'returns [] when nothing is playable', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P2, lane: 22, count: 2 },
			{ player: P2, lane: 20, count: 2 },
		] );
		expect( legalTurns( checkers, P1, [ 3, 5 ], false ) ).toEqual( [] );
	} );
	it( 'plays all four dice of a double when possible', () => {
		const turns = legalTurns( start, P1, [ 2, 2, 2, 2 ], false );
		expect( turns.length ).toBeGreaterThan( 0 );
		expect( turns.every( ( t ) => t.length === 4 ) ).toBe( true );
	} );
	it( 'deduplicates turns that move the same checkers the same way', () => {
		const checkers = pos( [ { player: P1, lane: 24, count: 2 } ] );
		const turns = legalTurns( checkers, P1, [ 3, 3, 3, 3 ], false );
		const keys = turns.map( ( t ) =>
			t.map( ( s ) => `${ s.from }>${ s.to }` ).join( ',' )
		);
		expect( new Set( keys ).size ).toBe( keys.length );
	} );
	it( 'ordered dice play dice[0] first', () => {
		const checkers = pos( [ { player: P1, lane: 24, count: 1 } ] );
		const turns = legalTurns( checkers, P1, [ 3, 5 ], true );
		expect( turns.every( ( t ) => t[ 0 ].die === 3 ) ).toBe( true );
	} );
} );

describe( 'legalSteps', () => {
	it( 'excludes a step that strands the other die when another ordering plays both', () => {
		// P1 on 10 and 24, dice 6 and 1. P2 blocks 3 and 23.
		// 10→4 with the 6 leaves the 1 unplayable (4→3 and 24→23 blocked),
		// while 24→18 with the 6 keeps 18→17 open.
		const checkers = pos( [
			{ player: P1, lane: 10, count: 1 },
			{ player: P1, lane: 24, count: 1 },
			{ player: P2, lane: 3, count: 2 },
			{ player: P2, lane: 23, count: 2 },
		] );
		const steps = legalSteps( checkers, P1, [ 6, 1 ], false );
		expect( steps.some( ( s ) => s.from === 10 && s.die === 6 ) ).toBe(
			false
		);
		expect( steps.some( ( s ) => s.from === 24 && s.die === 6 ) ).toBe(
			true
		);
	} );
	it( 'keeps only the larger die when exactly one die can be played', () => {
		// P1 on 24 only; 18 and 21 are open but 15 is blocked, so either die
		// can be played but never both.
		const checkers = pos( [
			{ player: P1, lane: 24, count: 1 },
			{ player: P2, lane: 15, count: 2 },
		] );
		const steps = legalSteps( checkers, P1, [ 6, 3 ], false );
		expect( steps ).toHaveLength( 1 );
		expect( steps[ 0 ].die ).toBe( 6 );
	} );
	it( 'allows the smaller die when only the smaller is playable', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P2, lane: 20, count: 2 },
		] );
		const steps = legalSteps( checkers, P1, [ 3, 5 ], false );
		expect( steps.map( ( s ) => s.die ) ).toEqual( [ 3 ] );
	} );
	it( 'returns [] when nothing is playable', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P2, lane: 22, count: 2 },
			{ player: P2, lane: 20, count: 2 },
		] );
		expect( legalSteps( checkers, P1, [ 3, 5 ], false ) ).toEqual( [] );
	} );
	it( 'ordered dice allow only dice[0]', () => {
		const checkers = pos( [
			{ player: P1, lane: 24, count: 1 },
			{ player: P1, lane: 13, count: 1 },
		] );
		const steps = legalSteps( checkers, P1, [ 3, 5 ], true );
		expect( steps.length ).toBeGreaterThan( 0 );
		expect( steps.every( ( s ) => s.die === 3 ) ).toBe( true );
	} );
	it( 'offers each (from, die) pair once in the start position', () => {
		const steps = legalSteps( start, P1, [ 3, 5 ], false );
		const keys = steps.map( ( s ) => `${ s.from }:${ s.die }` );
		expect( new Set( keys ).size ).toBe( keys.length );
		expect( steps.some( ( s ) => s.from === 13 && s.die === 5 ) ).toBe(
			true
		);
	} );
	it( 'doubles offer every die as the same value', () => {
		const steps = legalSteps( start, P1, [ 3, 3, 3, 3 ], false );
		expect( steps.every( ( s ) => s.die === 3 ) ).toBe( true );
		expect( steps.length ).toBeGreaterThan( 1 );
	} );
} );
