import { describe, expect, it } from 'vitest';
import { evaluateBackgammon } from '../../ai/features/backgammon';
import type { Checker } from '../../engine/types';
import { P1, P2, pos, stateWith } from '../engine/fixtures';

const score = ( checkers: Checker[], player = P1 ) =>
	evaluateBackgammon( stateWith( { checkers } ), player );

/** P2's army sits safely far from P1's home; individual cases add to it. */
const p2Rest = ( count: number ) => ( { player: P2, lane: 24, count } );

describe( 'evaluateBackgammon', () => {
	it( 'is symmetric between the two players', () => {
		const checkers = pos( [
			{ player: P1, lane: 13, count: 5 },
			{ player: P1, lane: 8, count: 3 },
			{ player: P1, lane: 6, count: 5 },
			{ player: P1, lane: 24, count: 2 },
			{ player: P2, lane: 12, count: 5 },
			{ player: P2, lane: 17, count: 3 },
			{ player: P2, lane: 19, count: 5 },
			{ player: P2, lane: 1, count: 2 },
		] );
		expect( score( checkers, P1 ) ).toBeCloseTo( -score( checkers, P2 ) );
	} );

	it( 'prefers hitting a blot to not hitting it', () => {
		const base = [
			{ player: P1, lane: 6, count: 5 },
			{ player: P1, lane: 13, count: 9 },
			p2Rest( 14 ),
		];
		const hit = pos( [ ...base, { player: P1, lane: 9, count: 1 }, { player: P2, lane: 25, count: 1 } ] );
		const noHit = pos( [ ...base, { player: P1, lane: 9, count: 1 }, { player: P2, lane: 11, count: 1 } ] );
		expect( score( hit ) ).toBeGreaterThan( score( noHit ) );
	} );

	it( 'prefers making the 5-point to leaving a blot there', () => {
		const shared = [ { player: P1, lane: 13, count: 8 }, { player: P1, lane: 6, count: 5 }, p2Rest( 13 ), { player: P2, lane: 1, count: 2 } ];
		const made = pos( [ ...shared, { player: P1, lane: 5, count: 2 } ] );
		const blots = pos( [ ...shared, { player: P1, lane: 5, count: 1 }, { player: P1, lane: 4, count: 1 } ] );
		expect( score( made ) ).toBeGreaterThan( score( blots ) );
	} );

	it( 'prefers a closed home board to an open one with the same pips', () => {
		const closed = pos( [
			{ player: P1, lane: 1, count: 2 }, { player: P1, lane: 2, count: 2 }, { player: P1, lane: 3, count: 2 },
			{ player: P1, lane: 4, count: 2 }, { player: P1, lane: 5, count: 2 }, { player: P1, lane: 6, count: 2 },
			{ player: P1, lane: 13, count: 3 },
			{ player: P2, lane: 25, count: 1 }, p2Rest( 14 ),
		] );
		// Same 81 pips, but the home board is two stacks.
		const open = pos( [
			{ player: P1, lane: 6, count: 6 }, { player: P1, lane: 1, count: 6 },
			{ player: P1, lane: 13, count: 3 },
			{ player: P2, lane: 25, count: 1 }, p2Rest( 14 ),
		] );
		expect( score( closed ) ).toBeGreaterThan( score( open ) );
	} );

	it( 'prefers being ahead in the race', () => {
		const ahead = pos( [ { player: P1, lane: 3, count: 15 }, { player: P2, lane: 20, count: 15 } ] );
		const behind = pos( [ { player: P1, lane: 6, count: 15 }, { player: P2, lane: 20, count: 15 } ] );
		expect( score( ahead ) ).toBeGreaterThan( score( behind ) );
	} );
} );
