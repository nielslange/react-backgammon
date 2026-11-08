import { describe, expect, it } from 'vitest';
import {
	gameResult,
	winKind,
	winner,
} from '../../engine/backgammon/result';
import { P1, P2, pos } from './fixtures';

const p1Off = { player: P1, lane: 25, count: 15 };

describe( 'winner', () => {
	it( 'is the player with all 15 checkers off', () => {
		const checkers = pos( [ p1Off, { player: P2, lane: 12, count: 15 } ] );
		expect( winner( checkers ) ).toBe( P1 );
	} );
	it( 'is P2 when P2 has all 15 checkers on lane 0', () => {
		const checkers = pos( [
			{ player: P1, lane: 12, count: 15 },
			{ player: P2, lane: 0, count: 15 },
		] );
		expect( winner( checkers ) ).toBe( P2 );
	} );
	it( 'is null while a checker remains on the board', () => {
		const checkers = pos( [
			{ player: P1, lane: 25, count: 14 },
			{ player: P1, lane: 1, count: 1 },
			{ player: P2, lane: 12, count: 15 },
		] );
		expect( winner( checkers ) ).toBeNull();
	} );
} );

describe( 'winKind', () => {
	it( 'single when the loser has borne off at least one checker', () => {
		const checkers = pos( [
			p1Off,
			{ player: P2, lane: 0, count: 1 },
			{ player: P2, lane: 12, count: 14 },
		] );
		expect( winKind( checkers, P1 ) ).toBe( 'single' );
	} );
	it( 'gammon when the loser has none off and is clear of bar and winner home', () => {
		const checkers = pos( [ p1Off, { player: P2, lane: 12, count: 15 } ] );
		expect( winKind( checkers, P1 ) ).toBe( 'gammon' );
	} );
	it( 'backgammon when the loser has none off and a checker on the bar', () => {
		const checkers = pos( [
			p1Off,
			{ player: P2, lane: 25, count: 1 },
			{ player: P2, lane: 12, count: 14 },
		] );
		expect( winKind( checkers, P1 ) ).toBe( 'backgammon' );
	} );
	it( 'backgammon when the loser has none off and a checker in the winner home', () => {
		const checkers = pos( [
			p1Off,
			{ player: P2, lane: 3, count: 1 },
			{ player: P2, lane: 12, count: 14 },
		] );
		expect( winKind( checkers, P1 ) ).toBe( 'backgammon' );
	} );
	it( 'uses P2 home 19-24 when P2 wins', () => {
		const checkers = pos( [
			{ player: P2, lane: 0, count: 15 },
			{ player: P1, lane: 20, count: 1 },
			{ player: P1, lane: 12, count: 14 },
		] );
		expect( winKind( checkers, P2 ) ).toBe( 'backgammon' );
	} );
} );

describe( 'gameResult', () => {
	it( 'is null while nobody has won', () => {
		const checkers = pos( [
			{ player: P1, lane: 12, count: 15 },
			{ player: P2, lane: 12, count: 15 },
		] );
		expect( gameResult( checkers, 1 ) ).toBeNull();
	} );
	it( 'awards 1, 2 or 3 points times the cube', () => {
		const single = pos( [
			p1Off,
			{ player: P2, lane: 0, count: 1 },
			{ player: P2, lane: 12, count: 14 },
		] );
		expect( gameResult( single, 2 ) ).toEqual( {
			winner: P1,
			points: 2,
			kind: 'single',
		} );
		const gammon = pos( [ p1Off, { player: P2, lane: 12, count: 15 } ] );
		expect( gameResult( gammon, 1 ) ).toEqual( {
			winner: P1,
			points: 2,
			kind: 'gammon',
		} );
		const backgammon = pos( [
			p1Off,
			{ player: P2, lane: 25, count: 1 },
			{ player: P2, lane: 12, count: 14 },
		] );
		expect( gameResult( backgammon, 4 ) ).toEqual( {
			winner: P1,
			points: 12,
			kind: 'backgammon',
		} );
	} );
} );
