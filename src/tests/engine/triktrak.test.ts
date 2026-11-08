/**
 * Dutch Triktrak rules.
 */
import { describe, expect, it } from 'vitest';
import { getEngine } from '../../engine';
import { expandRoll, isDouble, isTricTrac } from '../../engine/triktrak/rolls';
import { DEFAULT_OPTIONS } from '../../engine/types';
import type { GameState } from '../../engine/types';
import { P1, P2, pos, stateWith } from './fixtures';

const triktrak = getEngine( 'triktrak' );

const tt = ( partial: Partial< GameState > ): GameState =>
	stateWith( { variant: 'triktrak', ...partial } );

/** Both players fully entered and spread out, nothing blocked near P1. */
const spread = () =>
	pos( [
		{ player: P1, lane: 24, count: 2 },
		{ player: P1, lane: 20, count: 2 },
		{ player: P1, lane: 16, count: 2 },
		{ player: P1, lane: 13, count: 3 },
		{ player: P1, lane: 11, count: 2 },
		{ player: P1, lane: 9, count: 2 },
		{ player: P1, lane: 7, count: 2 },
		{ player: P2, lane: 1, count: 3 },
		{ player: P2, lane: 3, count: 3 },
		{ player: P2, lane: 5, count: 3 },
		{ player: P2, lane: 6, count: 3 },
		{ player: P2, lane: 8, count: 3 },
	] );

describe( 'Triktrak rolls', () => {
	it( 'recognises doubles and the tric trac', () => {
		expect( isDouble( [ 4, 4 ] ) ).toBe( true );
		expect( isDouble( [ 4, 3 ] ) ).toBe( false );
		expect( isTricTrac( [ 1, 2 ] ) ).toBe( true );
		expect( isTricTrac( [ 2, 1 ] ) ).toBe( true );
		expect( isTricTrac( [ 1, 1 ] ) ).toBe( false );
	} );

	it( 'expands doubles to n, n, 7-n, 7-n', () => {
		expect( expandRoll( [ 2, 2 ] ) ).toEqual( [ 2, 2, 5, 5 ] );
		expect( expandRoll( [ 6, 6 ] ) ).toEqual( [ 6, 6, 1, 1 ] );
	} );

	it( 'expands a tric trac to 1, 1, 2, 2, 5, 5, 6, 6', () => {
		expect( expandRoll( [ 2, 1 ] ) ).toEqual( [ 1, 1, 2, 2, 5, 5, 6, 6 ] );
	} );

	it( 'plays other rolls high die first', () => {
		expect( expandRoll( [ 3, 5 ] ) ).toEqual( [ 5, 3 ] );
	} );

	it( 'is wired as an engine with ordered dice and no cube', () => {
		expect( triktrak.id ).toBe( 'triktrak' );
		expect( triktrak.orderedDice ).toBe( true );
		expect( triktrak.supportsCube ).toBe( false );
		expect( triktrak.expandRoll( [ 1, 2 ], DEFAULT_OPTIONS ) ).toHaveLength( 8 );
	} );
} );

describe( 'Triktrak ordered play', () => {
	it( 'only offers steps with the next die', () => {
		const state = tt( { checkers: spread(), player: P1, dice: [ 5, 3 ] } );
		const steps = triktrak.legalSteps( state );
		expect( steps.length ).toBeGreaterThan( 0 );
		expect( steps.every( ( s ) => s.die === 5 ) ).toBe( true );
	} );

	it( 'prefers a first step that lets the next die be played', () => {
		// P1 only on 13 and 10; P2 holds 9 and 4. Dice 3 then 5:
		// 13→10 then 10→5 works; 10→7 then 7→2 works too; nothing strands.
		// Make 10→7 strand the 5: 7-5 = 2 is held by P2, and 13-5 = 8 too.
		const checkers = pos( [
			{ player: P1, lane: 13, count: 1 },
			{ player: P1, lane: 10, count: 1 },
			{ player: P1, lane: 25, count: 13 },
			{ player: P2, lane: 2, count: 2 },
			{ player: P2, lane: 8, count: 2 },
			{ player: P2, lane: 0, count: 11 },
		] );
		const steps = triktrak.legalSteps( tt( { checkers, player: P1, dice: [ 3, 5 ] } ) );
		expect( steps.map( ( s ) => s.from ) ).toEqual( [ 13 ] );
	} );

	it( 'finds the legal steps of a tric trac instantly from a busy position', () => {
		const state = tt( { checkers: spread(), player: P1, dice: expandRoll( [ 1, 2 ] ) } );
		const started = performance.now();
		const steps = triktrak.legalSteps( state );
		expect( performance.now() - started ).toBeLessThan( 100 );
		expect( steps.length ).toBeGreaterThan( 0 );
		expect( steps.every( ( s ) => s.die === 1 ) ).toBe( true );
	} );

	it( 'lists every distinct tric trac outcome, each playing all eight dice', () => {
		const state = tt( { checkers: spread(), player: P1, dice: expandRoll( [ 1, 2 ] ) } );
		const turns = triktrak.legalTurns( state );
		const firstSteps = triktrak.legalSteps( state ).map( ( s ) => s.from );
		expect( turns.length ).toBeGreaterThan( 1000 );
		expect( turns.every( ( t ) => t.length === 8 ) ).toBe( true );
		expect( turns.every( ( t ) => firstSteps.includes( t[ 0 ].from ) ) ).toBe( true );
	}, 10000 );
} );
