import { describe, it, expect } from 'vitest';
import { loadGame } from '../../data/actions';
import { MessageType, PlayerType } from '../../types';
import { createTestStore, makeCheckers } from '../integration/test-utils';

describe( 'loadGame', () => {
	it( 'replaces the position, player and dice and recomputes pip counts', () => {
		const store = createTestStore( { gameOver: true } );
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 6 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 13 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 19 },
		] );

		store.dispatch(
			loadGame( {
				checkers,
				currentPlayer: PlayerType.PLAYER_TWO,
				dice: [ 4, 2 ],
			} )
		);

		const state = store.getState();
		expect( state.checkers ).toEqual( checkers );
		expect( state.currentPlayer ).toBe( PlayerType.PLAYER_TWO );
		expect( state.dice ).toEqual( [ 4, 2 ] );
		expect( state.gameOver ).toBe( false );
		expect( state.moveHistory ).toEqual( [] );
		expect( state.preview ).toBe( null );
		expect( state.pipCount[ PlayerType.PLAYER_ONE ] ).toBe( 19 );
		expect( state.pipCount[ PlayerType.PLAYER_TWO ] ).toBe( 6 );
		expect( state.notice.message ).toBe( MessageType.GAME_LOADED );
	} );

	it( 'does not share checker objects with the caller', () => {
		const store = createTestStore();
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 6 },
		] );
		store.dispatch(
			loadGame( { checkers, currentPlayer: PlayerType.PLAYER_ONE } )
		);
		checkers[ 0 ].lane = 1;
		expect( store.getState().checkers[ 0 ].lane ).toBe( 6 );
	} );
} );
