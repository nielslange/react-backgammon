import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { chooseTurn, evaluatorFor } from '../../ai/bot';
import { evaluateTriktrak } from '../../ai/features/triktrak';
import { getEngine } from '../../engine';
import { play } from '../../engine/game';
import type { Checker, GameState, Roll, Turn } from '../../engine/types';
import { seeded } from '../../runtime/rng';
import { P1, P2, pos, stateWith } from '../engine/fixtures';

const triktrak = getEngine( 'triktrak' );
const tt = ( partial: Partial< GameState > ) => {
	const checkers = partial.checkers ?? [];
	return stateWith( {
		variant: 'triktrak',
		waiting: {
			[ P1 ]: checkers.filter( ( c ) => c.player === P1 && c.lane === 0 ).length,
			[ P2 ]: checkers.filter( ( c ) => c.player === P2 && c.lane === 25 ).length,
		},
		...partial,
	} );
};
const replay = ( state: GameState, turn: Turn ) => turn.reduce( ( s, step ) => play( s, step ), state );

describe( 'evaluateTriktrak', () => {
	it( 'is the evaluator the bot uses for Triktrak', () => {
		expect( evaluatorFor( 'triktrak' ) ).toBe( evaluateTriktrak );
	} );

	it( 'is symmetric between the players', () => {
		const state = tt( {
			checkers: pos( [
				{ player: P1, lane: 0, count: 5 }, { player: P1, lane: 20, count: 10 },
				{ player: P2, lane: 25, count: 7 }, { player: P2, lane: 3, count: 8 },
			] ),
		} );
		expect( evaluateTriktrak( state, P1 ) ).toBeCloseTo( -evaluateTriktrak( state, P2 ) );
	} );

	it( 'prefers having entered more checkers', () => {
		const more = tt( { checkers: pos( [ { player: P1, lane: 0, count: 5 }, { player: P1, lane: 22, count: 10 }, { player: P2, lane: 25, count: 15 } ] ) } );
		const fewer = tt( { checkers: pos( [ { player: P1, lane: 0, count: 10 }, { player: P1, lane: 22, count: 5 }, { player: P2, lane: 25, count: 15 } ] ) } );
		expect( evaluateTriktrak( more, P1 ) ).toBeGreaterThan( evaluateTriktrak( fewer, P1 ) );
	} );

	it( 'prefers points that block the opponent’s path to stacking behind them', () => {
		// Dark still has to come round through lanes 1..24; Light's points on 13–14 block that path.
		const blocking = tt( { checkers: pos( [ { player: P1, lane: 13, count: 2 }, { player: P1, lane: 14, count: 2 }, { player: P1, lane: 5, count: 11 }, { player: P2, lane: 3, count: 15 } ] ) } );
		const stacked = tt( { checkers: pos( [ { player: P1, lane: 13, count: 4 }, { player: P1, lane: 14, count: 0 }, { player: P1, lane: 5, count: 11 }, { player: P2, lane: 3, count: 15 } ] ) } );
		expect( evaluateTriktrak( blocking, P1 ) ).toBeGreaterThan( evaluateTriktrak( stacked, P1 ) );
	} );
} );

describe( 'the bot in Triktrak', () => {
	const lanes = fc.array( fc.integer( { min: 0, max: 24 } ), { minLength: 15, maxLength: 15 } );
	const roll = fc.tuple( fc.integer( { min: 1, max: 6 } ), fc.integer( { min: 1, max: 6 } ) ) as fc.Arbitrary< Roll >;

	it( 'always returns a legal turn of maximal length, tric trac included', () => {
		fc.assert(
			fc.property( lanes, roll, fc.constantFrom( 'easy', 'medium', 'hard' ), ( p1, r, level ) => {
				const checkers: Checker[] = [
					...p1.map( ( lane, i ) => ( { id: i + 1, player: P1, lane } ) ),
					...Array.from( { length: 15 }, ( _, i ) => ( { id: i + 16, player: P2, lane: 25 } ) ),
				];
				const state = tt( { checkers, player: P1, roll: r, dice: triktrak.expandRoll( r, stateWith( {} ).options ) } );
				const turn = chooseTurn( state, level, seeded( 5 ) );
				const steps = triktrak.legalSteps( state );
				if ( steps.length === 0 ) expect( turn ).toEqual( [] );
				else expect( () => replay( state, turn ) ).not.toThrow();
				// Whatever was played, nothing legal is left for this roll.
				if ( turn.length ) {
					const after = turn.reduce( ( s, step ) => triktrak.applyStep( s, step ), state );
					expect( triktrak.legalSteps( after ) ).toHaveLength( 0 );
				}
			} ),
			{ numRuns: 40 }
		);
	}, 60000 );
} );
