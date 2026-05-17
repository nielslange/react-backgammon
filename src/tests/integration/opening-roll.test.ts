import { describe, it, expect } from 'vitest';
import { rollOpeningDie } from '../../data/actions';
import { PlayerType } from '../../types';
import { createTestStore } from './test-utils';

describe( 'Opening roll', () => {
	it( 'higher single-die roller is set as currentPlayer', () => {
		const store = createTestStore();

		store.dispatch( rollOpeningDie( PlayerType.PLAYER_ONE, 5 ) );
		expect( store.getState().currentPlayer ).toBe( null );

		store.dispatch( rollOpeningDie( PlayerType.PLAYER_TWO, 3 ) );
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_ONE );
	} );

	it( 'opening turn uses both dice (higher first)', () => {
		const store = createTestStore();

		store.dispatch( rollOpeningDie( PlayerType.PLAYER_ONE, 6 ) );
		store.dispatch( rollOpeningDie( PlayerType.PLAYER_TWO, 2 ) );

		expect( store.getState().dice ).toEqual( [ 6, 2 ] );
	} );

	it( 'a tie clears both opening rolls and leaves currentPlayer null', () => {
		const store = createTestStore();

		store.dispatch( rollOpeningDie( PlayerType.PLAYER_ONE, 4 ) );
		store.dispatch( rollOpeningDie( PlayerType.PLAYER_TWO, 4 ) );

		expect( store.getState().openingRoll ).toEqual( {
			[ PlayerType.PLAYER_ONE ]: null,
			[ PlayerType.PLAYER_TWO ]: null,
		} );
		expect( store.getState().currentPlayer ).toBe( null );
	} );

	it( 'a successful re-roll after a tie sets the winner', () => {
		const store = createTestStore();

		store.dispatch( rollOpeningDie( PlayerType.PLAYER_ONE, 4 ) );
		store.dispatch( rollOpeningDie( PlayerType.PLAYER_TWO, 4 ) ); // tie
		store.dispatch( rollOpeningDie( PlayerType.PLAYER_ONE, 2 ) );
		store.dispatch( rollOpeningDie( PlayerType.PLAYER_TWO, 5 ) );

		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_TWO );
		expect( store.getState().dice ).toEqual( [ 5, 2 ] );
	} );

	it( 'mid-roll state holds one die without setting currentPlayer', () => {
		const store = createTestStore();

		store.dispatch( rollOpeningDie( PlayerType.PLAYER_TWO, 3 ) );

		expect(
			store.getState().openingRoll[ PlayerType.PLAYER_TWO ]
		).toBe( 3 );
		expect( store.getState().currentPlayer ).toBe( null );
		expect( store.getState().dice ).toEqual( [] );
	} );
} );
