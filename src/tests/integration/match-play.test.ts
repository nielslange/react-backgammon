/**
 * Match play + Crawford rule.
 *
 * Crawford rule: in the game directly after either player first reaches
 * match-point-minus-one, the doubling cube is not allowed. After that game,
 * doubling resumes.
 */
import { describe, it, expect } from 'vitest';
import {
	isCrawfordPending,
	isMatchOver,
	isCubeAllowed,
} from '../../helpers/matchHelper';
import { PlayerType } from '../../types';
import { setMatchTarget } from '../../data/actions';
import { createTestStore } from './test-utils';

const scores = ( p1: number, p2: number ) => ( {
	[ PlayerType.PLAYER_ONE ]: p1,
	[ PlayerType.PLAYER_TWO ]: p2,
} );

describe( 'Match end detection', () => {
	it( 'isMatchOver true when either player reaches the target', () => {
		expect( isMatchOver( scores( 5, 3 ), 5 ) ).toBe( true );
		expect( isMatchOver( scores( 3, 5 ), 5 ) ).toBe( true );
	} );

	it( 'isMatchOver false otherwise', () => {
		expect( isMatchOver( scores( 4, 3 ), 5 ) ).toBe( false );
	} );

	it( 'isMatchOver respects matches > target due to gammons/backgammons', () => {
		// e.g. score 6 in a 5-pt match (won via a gammon at 4-x).
		expect( isMatchOver( scores( 6, 2 ), 5 ) ).toBe( true );
	} );
} );

describe( 'Crawford rule', () => {
	it( 'isCrawfordPending true when either player is at target-1', () => {
		expect( isCrawfordPending( scores( 4, 2 ), 5 ) ).toBe( true );
		expect( isCrawfordPending( scores( 2, 4 ), 5 ) ).toBe( true );
	} );

	it( 'isCrawfordPending false otherwise', () => {
		expect( isCrawfordPending( scores( 3, 2 ), 5 ) ).toBe( false );
		expect( isCrawfordPending( scores( 5, 2 ), 5 ) ).toBe( false ); // match already won
	} );

	it( 'cube is disallowed in the Crawford game itself', () => {
		expect(
			isCubeAllowed( scores( 4, 2 ), 5, /*crawfordPlayed*/ false )
		).toBe( false );
	} );

	it( 'cube is allowed in post-Crawford games', () => {
		expect(
			isCubeAllowed( scores( 4, 2 ), 5, /*crawfordPlayed*/ true )
		).toBe( true );
	} );

	it( 'cube is always allowed before Crawford applies', () => {
		expect(
			isCubeAllowed( scores( 3, 2 ), 5, /*crawfordPlayed*/ false )
		).toBe( true );
	} );
} );

describe( 'Match target action', () => {
	it( 'setMatchTarget updates state', () => {
		const store = createTestStore();
		store.dispatch( setMatchTarget( 7 ) );
		expect( store.getState().matchTarget ).toBe( 7 );
	} );
} );
