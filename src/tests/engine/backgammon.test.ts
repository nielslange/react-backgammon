import { describe, expect, it } from 'vitest';
import { backgammon } from '../../engine/backgammon';
import { getEngine } from '../../engine';
import { EngineError } from '../../engine/errors';
import { DEFAULT_OPTIONS } from '../../engine/types';
import type { Checker } from '../../engine/types';
import startCheckers from '../../data/checkers-start.json';
import { P1, P2, pos, stateWith } from './fixtures';

const start = startCheckers as Checker[];

/** P1 on the bar with both entry points for a 6-6 blocked. */
const blockedBar = pos( [
	{ player: P1, lane: 0, count: 1 },
	{ player: P1, lane: 12, count: 14 },
	{ player: P2, lane: 19, count: 2 },
	{ player: P2, lane: 1, count: 13 },
] );

describe( 'getEngine', () => {
	it( 'returns the backgammon engine', () => {
		expect( getEngine( 'backgammon' ) ).toBe( backgammon );
		expect( backgammon.id ).toBe( 'backgammon' );
		expect( backgammon.supportsCube ).toBe( true );
		expect( backgammon.orderedDice ).toBe( false );
	} );
	it( 'throws for an unknown variant', () => {
		expect( () => getEngine( 'chess' as never ) ).toThrow();
	} );
	it( 'starts from the standard position with 15 checkers each', () => {
		const checkers = backgammon.initialCheckers();
		expect( checkers.filter( ( c ) => c.player === P1 ) ).toHaveLength( 15 );
		expect( checkers.filter( ( c ) => c.player === P2 ) ).toHaveLength( 15 );
		expect( checkers ).not.toBe( backgammon.initialCheckers() );
	} );
} );

describe( 'expandRoll', () => {
	it( 'turns doubles into four dice and orders others high-low', () => {
		expect( backgammon.expandRoll( [ 3, 3 ], DEFAULT_OPTIONS ) ).toEqual( [
			3, 3, 3, 3,
		] );
		expect( backgammon.expandRoll( [ 2, 5 ], DEFAULT_OPTIONS ) ).toEqual( [
			5, 2,
		] );
	} );
} );

describe( 'onRoll', () => {
	it( 'sets roll and dice and enters the moving phase', () => {
		const s = backgammon.onRoll(
			stateWith( { checkers: start, player: P1, phase: 'awaiting-roll' } ),
			[ 2, 5 ]
		);
		expect( s.phase ).toBe( 'moving' );
		expect( s.roll ).toEqual( [ 2, 5 ] );
		expect( s.dice ).toEqual( [ 5, 2 ] );
		expect( s.lastEvent ).toBeNull();
	} );
	it( 'forfeits the turn when nothing is playable without touching the board', () => {
		const s = backgammon.onRoll(
			stateWith( { checkers: blockedBar, player: P1, phase: 'awaiting-roll' } ),
			[ 6, 6 ]
		);
		expect( s.player ).toBe( P2 );
		expect( s.phase ).toBe( 'awaiting-roll' );
		expect( s.lastEvent ).toBe( 'forfeit' );
		expect( s.dice ).toEqual( [] );
		expect( s.checkers ).toEqual( blockedBar );
	} );
} );

describe( 'applyStep', () => {
	it( 'moves the checker, consumes the die and records the step', () => {
		const before = stateWith( { checkers: start, player: P1, dice: [ 5, 3 ] } );
		const step = backgammon.legalSteps( before ).find(
			( s ) => s.from === 13 && s.die === 5
		)!;
		const after = backgammon.applyStep( before, step );
		expect( after.dice ).toEqual( [ 3 ] );
		expect( after.turnSteps ).toEqual( [ step ] );
		expect( after.checkers.find( ( c ) => c.id === step.checkerId )?.lane ).toBe(
			8
		);
		expect( after.lastEvent ).toBeNull();
	} );
	it( 'flags a hit', () => {
		const checkers = pos( [
			{ player: P1, lane: 8, count: 1 },
			{ player: P1, lane: 24, count: 14 },
			{ player: P2, lane: 5, count: 1 },
			{ player: P2, lane: 1, count: 14 },
		] );
		const before = stateWith( { checkers, player: P1, dice: [ 3, 1 ] } );
		const step = backgammon.legalSteps( before ).find(
			( s ) => s.from === 8 && s.die === 3
		)!;
		const after = backgammon.applyStep( before, step );
		expect( after.lastEvent ).toBe( 'hit' );
		expect( after.checkers.filter( ( c ) => c.player === P2 && c.lane === 25 ) )
			.toHaveLength( 1 );
	} );
	it( 'rejects a step that is not legal', () => {
		const state = stateWith( { checkers: start, player: P1, dice: [ 5, 3 ] } );
		expect( () =>
			backgammon.applyStep( state, {
				checkerId: 1,
				from: 24,
				to: 10,
				die: 14,
				hit: false,
			} )
		).toThrow( EngineError );
	} );
	it( 'accepts a step by from and die even with another checker id', () => {
		const state = stateWith( { checkers: start, player: P1, dice: [ 5, 3 ] } );
		const after = backgammon.applyStep( state, {
			checkerId: 999,
			from: 13,
			to: 8,
			die: 5,
			hit: false,
		} );
		expect( after.checkers.filter( ( c ) => c.lane === 8 && c.player === P1 ) )
			.toHaveLength( 4 );
	} );
} );

describe( 'afterStep', () => {
	it( 'hands off when all dice are used', () => {
		const s = backgammon.afterStep(
			stateWith( { checkers: start, player: P1, dice: [], roll: [ 5, 3 ] } )
		);
		expect( s.player ).toBe( P2 );
		expect( s.phase ).toBe( 'awaiting-roll' );
		expect( s.roll ).toBeNull();
		expect( s.turnSteps ).toEqual( [] );
		expect( s.lastEvent ).toBe( 'hand-off' );
	} );
	it( 'keeps the turn while a die remains playable', () => {
		const s = backgammon.afterStep(
			stateWith( { checkers: start, player: P1, dice: [ 3 ] } )
		);
		expect( s.player ).toBe( P1 );
		expect( s.phase ).toBe( 'moving' );
	} );
	it( 'forfeits remaining unplayable dice', () => {
		const checkers = pos( [
			{ player: P1, lane: 24, count: 15 },
			{ player: P2, lane: 18, count: 2 },
			{ player: P2, lane: 1, count: 13 },
		] );
		const s = backgammon.afterStep(
			stateWith( { checkers, player: P1, dice: [ 6 ] } )
		);
		expect( s.player ).toBe( P2 );
		expect( s.phase ).toBe( 'awaiting-roll' );
		expect( s.dice ).toEqual( [] );
		expect( s.lastEvent ).toBe( 'forfeit' );
	} );
	it( 'ends the game when the last checker bears off', () => {
		const checkers = pos( [
			{ player: P1, lane: 25, count: 15 },
			{ player: P2, lane: 12, count: 15 },
		] );
		const s = backgammon.afterStep(
			stateWith( { checkers, player: P1, dice: [ 3 ], cube: { value: 2, owner: P2, offered: false } } )
		);
		expect( s.phase ).toBe( 'over' );
		expect( s.result ).toEqual( { winner: P1, points: 4, kind: 'gammon' } );
		expect( s.lastEvent ).toBe( 'game-over' );
	} );
} );

describe( 'result and pipCount', () => {
	it( 'delegate to the backgammon rules', () => {
		const s = stateWith( { checkers: start, player: P1 } );
		expect( backgammon.result( s ) ).toBeNull();
		expect( backgammon.pipCount( s, P1 ) ).toBe( 167 );
	} );
} );
