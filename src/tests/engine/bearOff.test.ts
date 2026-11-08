/**
 * Bear-off rules:
 *  - Eligibility: only when all checkers are in the home board, none on the bar.
 *  - An exact roll bears off the checker on point N.
 *  - An overshoot bears off only when no checker stands on a higher point.
 */
import { describe, expect, it } from 'vitest';
import { allInHome, canBearOffFrom } from '../../engine/backgammon/bearOff';
import { P1, P2, pos } from './fixtures';

describe( 'allInHome', () => {
	it( 'is false for P1 with a checker on the bar', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P1, lane: 1, count: 1 },
		] );
		expect( allInHome( checkers, P1 ) ).toBe( false );
	} );
	it( 'is false for P1 with a checker outside 1-6', () => {
		const checkers = pos( [
			{ player: P1, lane: 7, count: 1 },
			{ player: P1, lane: 1, count: 1 },
		] );
		expect( allInHome( checkers, P1 ) ).toBe( false );
	} );
	it( 'is true for P1 with checkers only in 1-6 and off', () => {
		const checkers = pos( [
			{ player: P1, lane: 1, count: 1 },
			{ player: P1, lane: 6, count: 1 },
			{ player: P1, lane: 25, count: 3 },
		] );
		expect( allInHome( checkers, P1 ) ).toBe( true );
	} );
	it( 'is false for P2 with a checker on the bar', () => {
		const checkers = pos( [
			{ player: P2, lane: 25, count: 1 },
			{ player: P2, lane: 19, count: 1 },
		] );
		expect( allInHome( checkers, P2 ) ).toBe( false );
	} );
	it( 'is true for P2 with checkers only in 19-24 and off', () => {
		const checkers = pos( [
			{ player: P2, lane: 19, count: 1 },
			{ player: P2, lane: 24, count: 1 },
			{ player: P2, lane: 0, count: 2 },
		] );
		expect( allInHome( checkers, P2 ) ).toBe( true );
	} );
	it( 'ignores the other player', () => {
		const checkers = pos( [
			{ player: P1, lane: 3, count: 1 },
			{ player: P2, lane: 12, count: 1 },
		] );
		expect( allInHome( checkers, P1 ) ).toBe( true );
	} );
} );

describe( 'canBearOffFrom', () => {
	it( 'P1 exact roll bears off', () => {
		const checkers = pos( [ { player: P1, lane: 4, count: 1 } ] );
		expect( canBearOffFrom( checkers, P1, 4, 4 ) ).toBe( true );
	} );
	it( 'P1 overshoot is allowed only when no higher point is occupied', () => {
		const alone = pos( [ { player: P1, lane: 2, count: 1 } ] );
		expect( canBearOffFrom( alone, P1, 2, 5 ) ).toBe( true );
		const higher = pos( [
			{ player: P1, lane: 2, count: 1 },
			{ player: P1, lane: 5, count: 1 },
		] );
		expect( canBearOffFrom( higher, P1, 2, 5 ) ).toBe( false );
	} );
	it( 'P1 die smaller than the point does not bear off', () => {
		const checkers = pos( [ { player: P1, lane: 5, count: 1 } ] );
		expect( canBearOffFrom( checkers, P1, 5, 3 ) ).toBe( false );
	} );
	it( 'P1 outside the home board never bears off', () => {
		const checkers = pos( [ { player: P1, lane: 7, count: 1 } ] );
		expect( canBearOffFrom( checkers, P1, 7, 6 ) ).toBe( false );
	} );
	it( 'P2 exact roll bears off', () => {
		const checkers = pos( [ { player: P2, lane: 20, count: 1 } ] );
		expect( canBearOffFrom( checkers, P2, 20, 5 ) ).toBe( true );
	} );
	it( 'P2 overshoot from 21 with a 6 is legal only when 19 and 20 are empty', () => {
		const alone = pos( [ { player: P2, lane: 21, count: 1 } ] );
		expect( canBearOffFrom( alone, P2, 21, 6 ) ).toBe( true );
		const higher = pos( [
			{ player: P2, lane: 21, count: 1 },
			{ player: P2, lane: 19, count: 1 },
		] );
		expect( canBearOffFrom( higher, P2, 21, 6 ) ).toBe( false );
		const lower = pos( [
			{ player: P2, lane: 21, count: 1 },
			{ player: P2, lane: 23, count: 1 },
		] );
		expect( canBearOffFrom( lower, P2, 21, 6 ) ).toBe( true );
	} );
} );
