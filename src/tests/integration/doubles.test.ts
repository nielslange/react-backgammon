import { describe, it, expect, vi, afterEach } from 'vitest';
import { rollDice, setDice, moveChecker } from '../../data/actions';
import { PlayerType } from '../../types';
import { createTestStore, padToFifteen } from './test-utils';

describe( 'Doubles', () => {
	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'expands a doubles roll to four entries in the dice array', () => {
		// Force the RNG to land on doubles (4-4).
		vi.spyOn( Math, 'random' ).mockReturnValue( 0.6 ); // floor(0.6*6)+1 = 4
		const store = createTestStore();

		store.dispatch( rollDice() );

		expect( store.getState().dice ).toEqual( [ 4, 4, 4, 4 ] );
	} );

	it( 'leaves a non-doubles roll as two entries', () => {
		const values = [ 0.0, 0.5 ]; // 1, 4
		const seq = vi.spyOn( Math, 'random' );
		values.forEach( ( v ) => seq.mockReturnValueOnce( v ) );
		const store = createTestStore();

		store.dispatch( rollDice() );

		expect( store.getState().dice ).toHaveLength( 2 );
		expect( new Set( store.getState().dice ).size ).toBe( 2 );
	} );

	it( 'consumes one die per move and yields four moves on doubles', () => {
		// Seed the store with doubles already rolled and a simple board.
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 3, 3, 3 ],
			checkers: padToFifteen( [
				{ id: 1, player: PlayerType.PLAYER_ONE, lane: 24 },
			] ),
		} );

		// Each MOVE_CHECKER + SET_DICE pair corresponds to one play.
		// We simulate the click-helper flow by directly updating checkers
		// and shifting the dice; this isolates the doubles plumbing from
		// move-validation logic (which is exercised in other suites).
		const advance = ( fromLane: number, toLane: number ) => {
			const next = store
				.getState()
				.checkers.map( ( c ) =>
					c.lane === fromLane && c.player === PlayerType.PLAYER_ONE
						? { ...c, lane: toLane }
						: c
				);
			store.dispatch( moveChecker( { checkers: next } ) );
			store.dispatch( setDice( store.getState().dice.slice( 1 ) ) );
		};

		advance( 24, 21 );
		expect( store.getState().dice ).toHaveLength( 3 );
		advance( 21, 18 );
		expect( store.getState().dice ).toHaveLength( 2 );
		advance( 18, 15 );
		expect( store.getState().dice ).toHaveLength( 1 );
		advance( 15, 12 );
		expect( store.getState().dice ).toHaveLength( 0 );
	} );
} );
