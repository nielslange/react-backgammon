import { describe, expect, it } from 'vitest';
import {
	countOn,
	hasBarChecker,
	isBlocked,
	moveOne,
	targetLane,
} from '../../engine/backgammon/movement';
import { P1, P2, pos } from './fixtures';

describe( 'targetLane', () => {
	it( 'P1 enters from the bar at 25 - die', () => {
		expect( targetLane( P1, 0, 5 ) ).toBe( 20 );
	} );
	it( 'P2 enters from the bar at die', () => {
		expect( targetLane( P2, 25, 5 ) ).toBe( 5 );
	} );
	it( 'P1 bears off to 25 from home with overshoot', () => {
		expect( targetLane( P1, 2, 5 ) ).toBe( 25 );
	} );
	it( 'P2 bears off to 0', () => {
		expect( targetLane( P2, 22, 3 ) ).toBe( 0 );
	} );
	it( 'P1 moves down the board', () => {
		expect( targetLane( P1, 13, 4 ) ).toBe( 9 );
	} );
	it( 'P2 moves up the board', () => {
		expect( targetLane( P2, 12, 4 ) ).toBe( 16 );
	} );
} );

describe( 'countOn and hasBarChecker', () => {
	it( 'counts only the given player on the lane', () => {
		const checkers = pos( [
			{ player: P1, lane: 5, count: 3 },
			{ player: P2, lane: 6, count: 1 },
		] );
		expect( countOn( checkers, 5, P1 ) ).toBe( 3 );
		expect( countOn( checkers, 5, P2 ) ).toBe( 0 );
	} );
	it( 'detects a checker on the player bar lane only', () => {
		const checkers = pos( [ { player: P1, lane: 0, count: 1 } ] );
		expect( hasBarChecker( checkers, P1 ) ).toBe( true );
		expect( hasBarChecker( checkers, P2 ) ).toBe( false );
	} );
} );

describe( 'isBlocked', () => {
	it( 'two opponent checkers block', () => {
		expect(
			isBlocked( pos( [ { player: P2, lane: 5, count: 2 } ] ), P1, 5 )
		).toBe( true );
	} );
	it( 'one opponent checker does not block', () => {
		expect(
			isBlocked( pos( [ { player: P2, lane: 5, count: 1 } ] ), P1, 5 )
		).toBe( false );
	} );
	it( 'the off lane is never blocked', () => {
		expect(
			isBlocked( pos( [ { player: P2, lane: 0, count: 3 } ] ), P2, 0 )
		).toBe( false );
	} );
} );

describe( 'moveOne', () => {
	it( 'hits a blot and sends it to the opponent bar', () => {
		const checkers = pos( [
			{ player: P1, lane: 8, count: 1 },
			{ player: P2, lane: 5, count: 1 },
		] );
		const { checkers: next, hit } = moveOne( checkers, P1, 1, 8, 5 );
		expect( hit ).toBe( true );
		expect( next.find( ( c ) => c.id === 2 )?.lane ).toBe( 25 );
		expect( next.find( ( c ) => c.id === 1 )?.lane ).toBe( 5 );
	} );
	it( 'moves another checker from the point when the id is not there', () => {
		const checkers = pos( [ { player: P1, lane: 8, count: 2 } ] );
		const { checkers: next, hit, moverId } = moveOne( checkers, P1, 99, 8, 5 );
		expect( hit ).toBe( false );
		expect( moverId ).toBe( 1 );
		expect( next.filter( ( c ) => c.lane === 5 ) ).toHaveLength( 1 );
		expect( next.filter( ( c ) => c.lane === 8 ) ).toHaveLength( 1 );
	} );
	it( 'does not mutate its input', () => {
		const checkers = pos( [
			{ player: P1, lane: 8, count: 1 },
			{ player: P2, lane: 5, count: 1 },
		] );
		const snapshot = JSON.stringify( checkers );
		moveOne( checkers, P1, 1, 8, 5 );
		expect( JSON.stringify( checkers ) ).toBe( snapshot );
	} );
	it( 'throws when no checker of the player stands on from', () => {
		const checkers = pos( [ { player: P2, lane: 8, count: 1 } ] );
		expect( () => moveOne( checkers, P1, null, 8, 5 ) ).toThrow();
	} );
} );
