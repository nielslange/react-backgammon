/**
 * Regressions from the Phase 1 review: untrusted snapshots and unknown
 * variants must fail with EngineError, never a TypeError.
 */
import { describe, expect, it } from 'vitest';
import { makeStore } from '../../data/createStore';
import { loadSnapshot, newGame, undoStep as undoAction } from '../../data/gameSlice';
import { getEngine } from '../../engine';
import { EngineError } from '../../engine/errors';
import { createGame, restore, undoStep } from '../../engine/game';
import { P1, P2, pos, stateWith } from './fixtures';

const code = ( fn: () => unknown ) => {
	try {
		fn();
	} catch ( e ) {
		return e instanceof EngineError ? e.code : `not EngineError: ${ String( e ) }`;
	}
	return undefined;
};

const valid = () => ( { ...createGame( 'backgammon' ), phase: 'moving', player: P1, dice: [ 3, 1 ], roll: [ 3, 1 ] } );

describe( 'unknown variants', () => {
	it( 'getEngine throws UNKNOWN_VARIANT', () => {
		expect( code( () => getEngine( 'chess' as never ) ) ).toBe( 'UNKNOWN_VARIANT' );
	} );
	it( 'newGame and loadSnapshot with an unregistered variant set lastError instead of throwing', () => {
		const store = makeStore();
		expect( () => store.dispatch( newGame( { variant: 'chess' as never } ) ) ).not.toThrow();
		expect( store.getState().game.lastError ).toBe( 'UNKNOWN_VARIANT' );
		expect( () =>
			store.dispatch( loadSnapshot( { snapshot: { ...valid(), variant: 'chess' } } ) )
		).not.toThrow();
		expect( store.getState().game.lastError ).toBe( 'UNKNOWN_VARIANT' );
	} );
} );

describe( 'restore validates every field', () => {
	const bad: Array< [ string, Record< string, unknown > ] > = [
		[ 'phase', { phase: 'bogus' } ],
		[ 'player', { player: 'PLAYER_NINE' } ],
		[ 'dice values', { dice: [ 'a', 99 ] } ],
		[ 'too many dice', { dice: [ 1, 1, 1, 1, 1 ] } ],
		[ 'roll', { roll: [ 7, 1 ] } ],
		[ 'cube value', { cube: { value: 'x', owner: null, offered: false } } ],
		[ 'cube owner', { cube: { value: 2, owner: 'nobody', offered: false } } ],
		[ 'turnSteps shape', { turnSteps: 'junk' } ],
		[ 'turnSteps unknown checker', { turnSteps: [ { checkerId: 999, from: 13, to: 10, die: 3, hit: false } ] } ],
		[ 'rerolls', { rerolls: -1 } ],
		[ 'result', { result: { winner: 'x', points: 1, kind: 'single' } } ],
		[ 'lastEvent', { lastEvent: 'boom' } ],
		[ 'options', { options: { cube: 'yes' } } ],
	];
	for ( const [ name, patch ] of bad ) {
		it( `rejects a malformed ${ name }`, () => {
			expect( code( () => restore( { ...valid(), ...patch } ) ) ).toBe( 'INVALID_POSITION' );
		} );
	}
	it( 'rejects fractional lanes and duplicate checker ids', () => {
		const frac = valid();
		frac.checkers = frac.checkers.map( ( c, i ) => ( i === 0 ? { ...c, lane: 3.5 } : c ) );
		expect( code( () => restore( frac ) ) ).toBe( 'INVALID_POSITION' );
		const dup = valid();
		dup.checkers = dup.checkers.map( ( c, i ) => ( i === 1 ? { ...c, id: dup.checkers[ 0 ].id } : c ) );
		expect( code( () => restore( dup ) ) ).toBe( 'INVALID_POSITION' );
	} );
	it( 'drops unknown keys instead of copying them', () => {
		const restored = restore( { ...valid(), evil: true } ) as unknown as Record< string, unknown >;
		expect( 'evil' in restored ).toBe( false );
	} );
	it( 'still accepts a normal mid-turn snapshot', () => {
		const s = valid();
		expect( restore( JSON.parse( JSON.stringify( s ) ) ) ).toEqual( s );
	} );
} );

describe( 'undoStep never throws a TypeError', () => {
	it( 'reports NOTHING_TO_UNDO when the recorded hit victim is not on the bar', () => {
		const state = stateWith( {
			checkers: pos( [
				{ player: P1, lane: 5, count: 1 },
				{ player: P1, lane: 24, count: 14 },
				{ player: P2, lane: 1, count: 15 },
			] ),
			dice: [ 1 ],
			turnSteps: [ { checkerId: 1, from: 8, to: 5, die: 3, hit: true } ],
		} );
		expect( code( () => undoStep( state ) ) ).toBe( 'NOTHING_TO_UNDO' );
	} );
	it( 'the reducer survives an undo on such a state', () => {
		const store = makeStore();
		expect( () => store.dispatch( undoAction() ) ).not.toThrow();
	} );
} );
