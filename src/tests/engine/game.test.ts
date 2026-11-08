/**
 * The shared game state machine on top of the backgammon engine.
 */
import { describe, expect, it } from 'vitest';
import { backgammon } from '../../engine/backgammon';
import { EngineError } from '../../engine/errors';
import {
	acceptDouble,
	createGame,
	dropDouble,
	offerDouble,
	openingRoll,
	play,
	resign,
	restore,
	roll,
	snapshot,
	undoStep,
} from '../../engine/game';
import type { GameState, Step } from '../../engine/types';
import { P1, P2, pos, stateWith } from './fixtures';

const code = ( fn: () => unknown ): string | undefined => {
	try {
		fn();
	} catch ( e ) {
		return ( e as EngineError ).code;
	}
	return undefined;
};

const stepFor = ( state: GameState, from: number, die: number ): Step =>
	backgammon.legalSteps( state ).find( ( s ) => s.from === from && s.die === die )!;

describe( 'createGame', () => {
	it( 'starts in the opening phase with the standard position and a centred cube', () => {
		const g = createGame( 'backgammon' );
		expect( g.phase ).toBe( 'opening' );
		expect( g.player ).toBeNull();
		expect( g.firstMover ).toBeNull();
		expect( g.checkers ).toHaveLength( 30 );
		expect( g.cube ).toEqual( { value: 1, owner: null, offered: false } );
		expect( g.options.cube ).toBe( true );
	} );
	it( 'merges options over the defaults', () => {
		expect( createGame( 'backgammon', { cube: false } ).options.cube ).toBe( false );
	} );
} );

describe( 'openingRoll', () => {
	it( 'higher die starts, both dice form the first roll, high first', () => {
		const g = openingRoll( createGame( 'backgammon' ), 2, 5 );
		expect( g.player ).toBe( P2 );
		expect( g.firstMover ).toBe( P2 );
		expect( g.roll ).toEqual( [ 2, 5 ] );
		expect( g.dice ).toEqual( [ 5, 2 ] );
		expect( g.phase ).toBe( 'moving' );
	} );
	it( 'a tie leaves the game in the opening phase', () => {
		const g = openingRoll( createGame( 'backgammon' ), 4, 4 );
		expect( g.phase ).toBe( 'opening' );
		expect( g.player ).toBeNull();
	} );
	it( 'is only allowed in the opening phase', () => {
		const g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		expect( code( () => openingRoll( g, 3, 2 ) ) ).toBe( 'WRONG_PHASE' );
	} );
} );

describe( 'roll and play', () => {
	it( 'roll is only allowed while awaiting a roll', () => {
		const g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		expect( code( () => roll( g, [ 3, 2 ] ) ) ).toBe( 'WRONG_PHASE' );
	} );
	it( 'a full turn hands off and the opponent can roll', () => {
		let g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		g = play( g, stepFor( g, 13, 6 ) );
		expect( g.player ).toBe( P1 );
		expect( g.dice ).toEqual( [ 1 ] );
		g = play( g, stepFor( g, 8, 1 ) );
		expect( g.player ).toBe( P2 );
		expect( g.phase ).toBe( 'awaiting-roll' );
		g = roll( g, [ 4, 4 ] );
		expect( g.player ).toBe( P2 );
		expect( g.dice ).toEqual( [ 4, 4, 4, 4 ] );
	} );
	it( 'play rejects an illegal step and a wrong phase', () => {
		const g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		expect(
			code( () => play( g, { checkerId: 1, from: 24, to: 10, die: 14, hit: false } ) )
		).toBe( 'ILLEGAL_STEP' );
		expect(
			code( () => play( createGame( 'backgammon' ), stepFor( g, 13, 6 ) ) )
		).toBe( 'WRONG_PHASE' );
	} );
	it( 'a win by the mover ends the game before the opponent rolls', () => {
		const checkers = pos( [
			{ player: P1, lane: 25, count: 14 },
			{ player: P1, lane: 2, count: 1 },
			{ player: P2, lane: 12, count: 15 },
		] );
		const before = stateWith( { checkers, player: P1, dice: [ 3 ], roll: [ 3, 1 ] } );
		const after = play( before, stepFor( before, 2, 3 ) );
		expect( after.phase ).toBe( 'over' );
		expect( after.result ).toEqual( { winner: P1, points: 2, kind: 'gammon' } );
		expect( code( () => roll( after, [ 1, 2 ] ) ) ).toBe( 'WRONG_PHASE' );
	} );
	it( 'multiplies the win by the cube value', () => {
		const checkers = pos( [
			{ player: P1, lane: 25, count: 14 },
			{ player: P1, lane: 2, count: 1 },
			{ player: P2, lane: 0, count: 1 },
			{ player: P2, lane: 12, count: 14 },
		] );
		const before = stateWith( {
			checkers,
			player: P1,
			dice: [ 3 ],
			cube: { value: 4, owner: P1, offered: false },
		} );
		expect( play( before, stepFor( before, 2, 3 ) ).result?.points ).toBe( 4 );
	} );
} );

describe( 'undoStep', () => {
	it( 'undo after a hit returns the hit checker to the point it was hit on', () => {
		const before = stateWith( {
			checkers: pos( [
				{ player: P1, lane: 8, count: 1 },
				{ player: P1, lane: 24, count: 14 },
				{ player: P2, lane: 5, count: 1 },
				{ player: P2, lane: 1, count: 14 },
			] ),
			player: P1,
			dice: [ 3, 1 ],
		} );
		const after = undoStep( play( before, stepFor( before, 8, 3 ) ) );
		expect( after.checkers ).toEqual( before.checkers );
		expect( [ ...after.dice ].sort() ).toEqual( [ 1, 3 ] );
		expect( after.turnSteps ).toEqual( [] );
		expect( after.lastEvent ).toBe( 'undo' );
	} );
	it( 'restores the moved checker even when the step named another id', () => {
		const before = stateWith( {
			checkers: pos( [
				{ player: P1, lane: 13, count: 2 },
				{ player: P1, lane: 24, count: 13 },
				{ player: P2, lane: 1, count: 15 },
			] ),
			player: P1,
			dice: [ 5, 3 ],
		} );
		const moved = play( before, { ...stepFor( before, 13, 5 ), checkerId: 999 } );
		expect( undoStep( moved ).checkers ).toEqual( before.checkers );
	} );
	it( 'is impossible once the turn has been handed off', () => {
		let g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		g = play( g, stepFor( g, 13, 6 ) );
		g = play( g, stepFor( g, 8, 1 ) );
		expect( code( () => undoStep( g ) ) ).toBe( 'NOTHING_TO_UNDO' );
	} );
	it( 'is impossible with nothing played', () => {
		const g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		expect( code( () => undoStep( g ) ) ).toBe( 'NOTHING_TO_UNDO' );
	} );
} );

describe( 'resign', () => {
	it( 'gives the opponent the cube value', () => {
		const g = stateWith( {
			checkers: backgammon.initialCheckers(),
			player: P1,
			dice: [ 3, 1 ],
			cube: { value: 2, owner: P2, offered: false },
		} );
		const after = resign( g, P1 );
		expect( after.phase ).toBe( 'over' );
		expect( after.result ).toEqual( { winner: P2, points: 2, kind: 'resign' } );
	} );
	it( 'is not allowed once the game is over', () => {
		const over = stateWith( { phase: 'over' } );
		expect( code( () => resign( over, P1 ) ) ).toBe( 'WRONG_PHASE' );
	} );
} );

describe( 'doubling cube', () => {
	const awaiting = ( cube = { value: 1, owner: null as typeof P1 | null, offered: false } ) =>
		stateWith( {
			checkers: backgammon.initialCheckers(),
			player: P1,
			phase: 'awaiting-roll',
			cube,
		} );

	it( 'the player to roll may offer a centred cube before rolling', () => {
		const g = offerDouble( awaiting(), P1 );
		expect( g.cube.offered ).toBe( true );
	} );
	it( 'the opponent of the player to roll may not offer', () => {
		expect( code( () => offerDouble( awaiting(), P2 ) ) ).toBe( 'NOT_YOUR_TURN' );
	} );
	it( 'cannot offer after rolling or when the opponent owns the cube', () => {
		expect( code( () => offerDouble( { ...awaiting(), phase: 'moving' }, P1 ) ) ).toBe(
			'WRONG_PHASE'
		);
		expect(
			code( () => offerDouble( awaiting( { value: 2, owner: P2, offered: false } ), P1 ) )
		).toBe( 'CUBE_NOT_ALLOWED' );
	} );
	it( 'cannot offer when the game runs without a cube', () => {
		const g = { ...awaiting(), options: { ...awaiting().options, cube: false } };
		expect( code( () => offerDouble( g, P1 ) ) ).toBe( 'CUBE_NOT_ALLOWED' );
	} );
	it( 'accepting doubles the value and transfers ownership to the acceptor', () => {
		const g = acceptDouble( offerDouble( awaiting(), P1 ) );
		expect( g.cube ).toEqual( { value: 2, owner: P2, offered: false } );
		expect( g.phase ).toBe( 'awaiting-roll' );
	} );
	it( 're-doubles keep doubling', () => {
		const g = acceptDouble(
			offerDouble( { ...awaiting( { value: 2, owner: P2, offered: false } ), player: P2 }, P2 )
		);
		expect( g.cube ).toEqual( { value: 4, owner: P1, offered: false } );
	} );
	it( 'dropping ends the game with the pre-double stake for the offerer', () => {
		const g = dropDouble( offerDouble( awaiting( { value: 4, owner: P1, offered: false } ), P1 ) );
		expect( g.phase ).toBe( 'over' );
		expect( g.result ).toEqual( { winner: P1, points: 4, kind: 'drop' } );
		expect( g.cube.offered ).toBe( false );
	} );
	it( 'accept and drop need an open offer', () => {
		expect( code( () => acceptDouble( awaiting() ) ) ).toBe( 'CUBE_NOT_ALLOWED' );
		expect( code( () => dropDouble( awaiting() ) ) ).toBe( 'CUBE_NOT_ALLOWED' );
	} );
} );

describe( 'snapshot and restore', () => {
	it( 'round-trips a game through JSON', () => {
		const g = openingRoll( createGame( 'backgammon' ), 6, 1 );
		const restored = restore( JSON.parse( JSON.stringify( snapshot( g ) ) ) );
		expect( restored ).toEqual( g );
		expect( restored.checkers ).not.toBe( g.checkers );
	} );
	it( 'rejects a position with both players on one point', () => {
		const g = createGame( 'backgammon' );
		const bad = {
			...g,
			checkers: pos( [
				{ player: P1, lane: 5, count: 1 },
				{ player: P1, lane: 24, count: 14 },
				{ player: P2, lane: 5, count: 1 },
				{ player: P2, lane: 1, count: 14 },
			] ),
		};
		expect( code( () => restore( bad ) ) ).toBe( 'INVALID_POSITION' );
	} );
	it( 'allows both players on lanes 0 and 25', () => {
		const g = createGame( 'backgammon' );
		const ok = {
			...g,
			checkers: pos( [
				{ player: P1, lane: 0, count: 1 },
				{ player: P1, lane: 24, count: 14 },
				{ player: P2, lane: 0, count: 1 },
				{ player: P2, lane: 1, count: 14 },
			] ),
		};
		expect( restore( ok ).checkers ).toEqual( ok.checkers );
	} );
	it( 'rejects a player with more or fewer than 15 checkers', () => {
		const g = createGame( 'backgammon' );
		const bad = { ...g, checkers: pos( [ { player: P1, lane: 6, count: 1 } ] ) };
		expect( code( () => restore( bad ) ) ).toBe( 'INVALID_POSITION' );
	} );
	it( 'rejects garbage', () => {
		expect( code( () => restore( null ) ) ).toBe( 'INVALID_POSITION' );
		expect( code( () => restore( { variant: 'chess' } ) ) ).toBe( 'INVALID_POSITION' );
	} );
} );
