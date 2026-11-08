/**
 * Property tests over random legal positions and rolls.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { backgammon } from '../../engine/backgammon';
import { pipCount } from '../../engine/backgammon/pips';
import { legalSteps, legalTurns } from '../../engine/backgammon/turns';
import { OFF } from '../../engine/constants';
import { play } from '../../engine/game';
import { getEngine } from '../../engine';
import { DEFAULT_OPTIONS } from '../../engine/types';
import type { Checker, Player, Roll } from '../../engine/types';
import { P1, P2, stateWith } from './fixtures';

const lanes15 = fc.array( fc.integer( { min: 0, max: 25 } ), {
	minLength: 15,
	maxLength: 15,
} );

/** 15 checkers each, no point 1–24 holding both colours. */
const position: fc.Arbitrary< Checker[] > = lanes15.chain( ( p1Lanes ) => {
	const taken = new Set( p1Lanes.filter( ( l ) => l >= 1 && l <= 24 ) );
	const free = [
		0,
		25,
		...Array.from( { length: 24 }, ( _, i ) => i + 1 ),
	].filter( ( l ) => ! taken.has( l ) );
	return fc
		.array( fc.constantFrom( ...free ), { minLength: 15, maxLength: 15 } )
		.map( ( p2Lanes ) => [
			...p1Lanes.map( ( lane, i ) => ( {
				id: i + 1,
				player: P1,
				lane,
			} ) ),
			...p2Lanes.map( ( lane, i ) => ( {
				id: i + 16,
				player: P2,
				lane,
			} ) ),
		] );
} );

const roll: fc.Arbitrary< Roll > = fc.tuple(
	fc.integer( { min: 1, max: 6 } ),
	fc.integer( { min: 1, max: 6 } )
);

const player: fc.Arbitrary< Player > = fc.constantFrom( P1, P2 );

describe( 'engine properties', () => {
	it( 'every legal step starts a maximal turn', () => {
		fc.assert(
			fc.property( position, roll, player, ( checkers, r, p ) => {
				const dice = backgammon.expandRoll( r, DEFAULT_OPTIONS );
				const turns = legalTurns( checkers, p, dice, false );
				const max = Math.max( 0, ...turns.map( ( t ) => t.length ) );
				for ( const step of legalSteps( checkers, p, dice, false ) ) {
					expect(
						turns.some(
							( t ) =>
								t[ 0 ].from === step.from &&
								t[ 0 ].die === step.die &&
								t.length === max
						)
					).toBe( true );
				}
			} )
		);
	} );

	// Many random games: a generous limit for busy machines and CI.
	it(
		'playing a legal step never throws and keeps 15 checkers per player',
		{ timeout: 30000 },
		() => {
			fc.assert(
				fc.property( position, roll, player, ( checkers, r, p ) => {
					const state = stateWith( {
						checkers,
						player: p,
						roll: r,
						dice: backgammon.expandRoll( r, DEFAULT_OPTIONS ),
					} );
					for ( const step of backgammon.legalSteps( state ) ) {
						const next = play( state, step );
						expect(
							next.checkers.filter( ( c ) => c.player === P1 )
						).toHaveLength( 15 );
						expect(
							next.checkers.filter( ( c ) => c.player === P2 )
						).toHaveLength( 15 );
						expect(
							next.checkers
								.map( ( c ) => c.id )
								.sort( ( a, b ) => a - b )
						).toEqual(
							checkers
								.map( ( c ) => c.id )
								.sort( ( a, b ) => a - b )
						);
					}
				} )
			);
		}
	);

	it( 'pip count decreases by exactly the die on a step that stays on the board', () => {
		fc.assert(
			fc.property( position, roll, player, ( checkers, r, p ) => {
				const state = stateWith( {
					checkers,
					player: p,
					roll: r,
					dice: backgammon.expandRoll( r, DEFAULT_OPTIONS ),
				} );
				for ( const step of backgammon.legalSteps( state ) ) {
					if ( step.to === OFF[ p ] ) continue;
					const after = backgammon.applyStep( state, step ).checkers;
					expect(
						pipCount( checkers, p ) - pipCount( after, p )
					).toBe( step.die );
				}
			} )
		);
	} );

	it( 'a legal turn is always accepted step by step', () => {
		fc.assert(
			fc.property( position, roll, player, ( checkers, r, p ) => {
				const start = stateWith( {
					checkers,
					player: p,
					roll: r,
					dice: backgammon.expandRoll( r, DEFAULT_OPTIONS ),
				} );
				const turns = backgammon.legalTurns( start );
				if ( turns.length === 0 ) return;
				let state = start;
				for ( const step of turns[ 0 ] ) {
					state = play( state, step );
				}
				expect( state.player === p && state.phase === 'moving' ).toBe(
					false
				);
			} )
		);
	} );
} );

describe( 'Triktrak properties', () => {
	const triktrak = getEngine( 'triktrak' );
	const ttState = ( checkers: Checker[], r: Roll, p: Player ) =>
		stateWith( {
			variant: 'triktrak',
			checkers,
			player: p,
			roll: r,
			dice: triktrak.expandRoll( r, DEFAULT_OPTIONS ),
		} );

	it( 'every legal step uses the next die and keeps 15 checkers per player', () => {
		fc.assert(
			fc.property( position, roll, player, ( checkers, r, p ) => {
				const state = ttState( checkers, r, p );
				for ( const step of triktrak.legalSteps( state ) ) {
					expect( step.die ).toBe( state.dice[ 0 ] );
					const next = play( state, step );
					expect(
						next.checkers.filter( ( c ) => c.player === P1 )
					).toHaveLength( 15 );
					expect(
						next.checkers.filter( ( c ) => c.player === P2 )
					).toHaveLength( 15 );
				}
			} ),
			{ numRuns: 60 }
		);
	} );

	it( 'every legal step starts a line that plays the most dice (non-tric-trac rolls)', () => {
		fc.assert(
			fc.property(
				position,
				roll.filter(
					( [ a, b ] ) =>
						! ( Math.min( a, b ) === 1 && Math.max( a, b ) === 2 )
				),
				player,
				( checkers, r, p ) => {
					const state = ttState( checkers, r, p );
					const turns = triktrak.legalTurns( state );
					const max = Math.max(
						0,
						...turns.map( ( t ) => t.length )
					);
					for ( const step of triktrak.legalSteps( state ) ) {
						const after = triktrak.applyStep( state, step );
						const rest = triktrak.legalTurns( {
							...after,
							dice: after.dice,
						} );
						const longest = Math.max(
							0,
							...rest.map( ( t ) => t.length )
						);
						expect( 1 + longest ).toBe( max );
					}
				}
			),
			{ numRuns: 60 }
		);
	} );
} );
