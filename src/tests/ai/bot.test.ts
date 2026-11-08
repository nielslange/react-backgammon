import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { answerDouble, chooseTurn, decideCube, winProbability } from '../../ai/bot';
import { LEVELS } from '../../ai/levels';
import { getEngine } from '../../engine';
import { play } from '../../engine/game';
import type { Checker, GameState, Roll, Turn } from '../../engine/types';
import { seeded } from '../../runtime/rng';
import { P1, P2, pos, stateWith } from '../engine/fixtures';

const backgammon = getEngine( 'backgammon' );
const replay = ( state: GameState, turn: Turn ) => turn.reduce( ( s, step ) => play( s, step ), state );
const desc = ( turn: Turn ) => turn.map( ( s ) => `${ s.from }/${ s.to }` ).sort().join( ' ' );

/** Random legal backgammon positions with P1 to move. */
const position = fc.array( fc.integer( { min: 1, max: 25 } ), { minLength: 15, maxLength: 15 } ).chain( ( p1 ) => {
	const taken = new Set( p1.filter( ( l ) => l <= 24 ) );
	const free = Array.from( { length: 25 }, ( _, i ) => i ).filter( ( l ) => ! taken.has( l ) || l === 0 );
	return fc.array( fc.constantFrom( ...free ), { minLength: 15, maxLength: 15 } ).map( ( p2 ) => [
		...p1.map( ( lane, i ) => ( { id: i + 1, player: P1, lane } ) ),
		...p2.map( ( lane, i ) => ( { id: i + 16, player: P2, lane } ) ),
	] as Checker[] );
} );
const roll = fc.tuple( fc.integer( { min: 1, max: 6 } ), fc.integer( { min: 1, max: 6 } ) ) as fc.Arbitrary< Roll >;
const moving = ( checkers: Checker[], r: Roll ) =>
	stateWith( { checkers, player: P1, roll: r, dice: backgammon.expandRoll( r, stateWith( {} ).options ) } );

describe( 'levels', () => {
	it( 'are easy = random, medium = one ply with noise, hard = two ply', () => {
		expect( LEVELS.easy.ply ).toBe( 0 );
		expect( LEVELS.medium ).toMatchObject( { ply: 1, topK: 3, noise: 0.2 } );
		expect( LEVELS.hard ).toMatchObject( { ply: 2, topN: 8 } );
	} );
} );

describe( 'chooseTurn', () => {
	for ( const [ level, runs ] of [ [ 'easy', 150 ], [ 'medium', 150 ], [ 'hard', 15 ] ] as const ) {
		it( `${ level } always returns a legal turn that plays as many dice as possible`, () => {
			fc.assert(
				fc.property( position, roll, fc.integer(), ( checkers, r, seed ) => {
					const state = moving( checkers, r );
					const turn = chooseTurn( state, level, seeded( seed ) );
					const max = Math.max( 0, ...backgammon.legalTurns( state ).map( ( t ) => t.length ) );
					expect( turn ).toHaveLength( max );
					expect( () => replay( state, turn ) ).not.toThrow();
				} ),
				{ numRuns: runs }
			);
		}, 60000 );
	}

	it( 'is deterministic for a seed', () => {
		const state = moving( backgammon.initialCheckers(), [ 5, 2 ] );
		for ( const level of [ 'easy', 'medium' ] as const ) {
			expect( desc( chooseTurn( state, level, seeded( 9 ) ) ) ).toBe( desc( chooseTurn( state, level, seeded( 9 ) ) ) );
		}
	} );

	it( 'hard plays the textbook 3-1 opening; easy does not always', () => {
		const state = moving( backgammon.initialCheckers(), [ 3, 1 ] );
		expect( desc( chooseTurn( state, 'hard', seeded( 1 ) ) ) ).toBe( '6/5 8/5' );
		const easy = new Set( Array.from( { length: 12 }, ( _, i ) => desc( chooseTurn( state, 'easy', seeded( i ) ) ) ) );
		expect( easy.size ).toBeGreaterThan( 1 );
	} );

	it( 'hard does not slot a lone checker on the 1- or 2-point in the opening', () => {
		const rolls: Roll[] = [ [ 5, 1 ], [ 6, 3 ], [ 2, 1 ], [ 4, 4 ], [ 6, 2 ], [ 4, 1 ], [ 3, 2 ], [ 6, 4 ], [ 5, 2 ] ];
		const buried = rolls.filter( ( roll ) => {
			const state = moving( backgammon.initialCheckers(), roll );
			const after = replay( state, chooseTurn( state, 'hard', seeded( 1 ) ) ).checkers;
			// Making the 2-point (6-4: 8/2 6/2) is a book play; a lone checker there is not.
			return [ 1, 2 ].some( ( lane ) => after.filter( ( c ) => c.player === P1 && c.lane === lane ).length === 1 );
		} );
		expect( buried ).toEqual( [] );
	} );
} );

describe( 'cube decisions', () => {
	const race = ( p1Lane: number, p2Lane: number, player = P1 ) =>
		stateWith( {
			checkers: pos( [ { player: P1, lane: p1Lane, count: 15 }, { player: P2, lane: p2Lane, count: 15 } ] ),
			player,
			phase: 'awaiting-roll',
			dice: [],
		} );

	it( 'estimates winning chances between 0 and 1, high when far ahead', () => {
		expect( winProbability( race( 2, 13 ), P1 ) ).toBeGreaterThan( 0.9 );
		expect( winProbability( race( 2, 13 ), P2 ) ).toBeLessThan( 0.1 );
		const even = stateWith( { checkers: backgammon.initialCheckers(), player: P1, phase: 'awaiting-roll', dice: [] } );
		expect( winProbability( even, P1 ) ).toBeGreaterThan( 0.4 );
		expect( winProbability( even, P1 ) ).toBeLessThan( 0.65 );
	} );

	it( 'hard doubles when clearly ahead and rolls when even; easier levels never double', () => {
		expect( decideCube( race( 3, 11 ), P1, 'hard' ) ).toBe( 'double' );
		const even = stateWith( { checkers: backgammon.initialCheckers(), player: P1, phase: 'awaiting-roll', dice: [] } );
		expect( decideCube( even, P1, 'hard' ) ).toBe( 'roll' );
		expect( decideCube( race( 3, 11 ), P1, 'medium' ) ).toBe( 'roll' );
	} );

	it( 'takes a fair double and drops a hopeless one', () => {
		const even = stateWith( { checkers: backgammon.initialCheckers(), player: P1, phase: 'awaiting-roll', dice: [] } );
		expect( answerDouble( even, P2, 'hard' ) ).toBe( 'take' );
		expect( answerDouble( race( 2, 13 ), P2, 'hard' ) ).toBe( 'drop' );
	} );
} );
