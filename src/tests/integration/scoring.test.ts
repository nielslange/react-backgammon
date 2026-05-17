import { describe, it, expect, vi } from 'vitest';
import { PlayerType } from '../../types';
import { getWinType } from '../../data/selectors';
import { checkForWin } from '../../helpers/checkForWinHelper';
import { createTestStore, makeCheckers } from './test-utils';

const allBornOff = ( player: PlayerType ) =>
	makeCheckers(
		Array.from( { length: 15 }, () => ( {
			player,
			lane: player === PlayerType.PLAYER_ONE ? 25 : 0,
		} ) )
	);

describe( 'getWinType', () => {
	it( 'returns single when loser has borne off ≥1 checker', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			// Loser: P2 has borne off 1, others mid-board.
			...makeCheckers( [
				{ player: PlayerType.PLAYER_TWO, lane: 0 }, // borne off
				...Array.from( { length: 14 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) ),
			] ),
		];

		expect(
			getWinType( { checkers, winner: PlayerType.PLAYER_ONE } )
		).toBe( 'single' );
	} );

	it( 'returns gammon when loser has zero borne off and is clear of bar/winner-home', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			// Loser: 15 checkers all mid-board (lane 12 — not in P1 home 1-6, not on bar).
			...makeCheckers(
				Array.from( { length: 15 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) )
			),
		];

		expect(
			getWinType( { checkers, winner: PlayerType.PLAYER_ONE } )
		).toBe( 'gammon' );
	} );

	it( 'returns backgammon when loser has zero borne off AND a checker on the bar', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			...makeCheckers( [
				{ player: PlayerType.PLAYER_TWO, lane: 25 }, // on bar
				...Array.from( { length: 14 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) ),
			] ),
		];

		expect(
			getWinType( { checkers, winner: PlayerType.PLAYER_ONE } )
		).toBe( 'backgammon' );
	} );

	it( 'returns backgammon when loser has zero borne off AND a checker in winner home', () => {
		// Winner is P1 → P1 home is lanes 1-6.
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			...makeCheckers( [
				{ player: PlayerType.PLAYER_TWO, lane: 3 }, // in P1 home
				...Array.from( { length: 14 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) ),
			] ),
		];

		expect(
			getWinType( { checkers, winner: PlayerType.PLAYER_ONE } )
		).toBe( 'backgammon' );
	} );

	it( 'mirrors correctly for Player 2 winner', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_TWO ),
			// P1 loser, no borne off, has a checker on lane 22 (P2 home is 19-24).
			...makeCheckers( [
				{ player: PlayerType.PLAYER_ONE, lane: 22 },
				...Array.from( { length: 14 }, () => ( {
					player: PlayerType.PLAYER_ONE,
					lane: 12,
				} ) ),
			] ),
		];

		expect(
			getWinType( { checkers, winner: PlayerType.PLAYER_TWO } )
		).toBe( 'backgammon' );
	} );
} );

describe( 'checkForWin awards points', () => {
	it( 'awards 1 point for a single', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			...makeCheckers( [
				{ player: PlayerType.PLAYER_TWO, lane: 0 }, // borne off
				...Array.from( { length: 14 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) ),
			] ),
		];
		const store = createTestStore( { checkers } );

		checkForWin( store.dispatch, checkers, PlayerType.PLAYER_ONE );

		expect( store.getState().scores[ PlayerType.PLAYER_ONE ] ).toBe( 1 );
		expect( store.getState().gameOver ).toBe( true );
	} );

	it( 'awards 2 points for a gammon', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			...makeCheckers(
				Array.from( { length: 15 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) )
			),
		];
		const store = createTestStore( { checkers } );

		checkForWin( store.dispatch, checkers, PlayerType.PLAYER_ONE );

		expect( store.getState().scores[ PlayerType.PLAYER_ONE ] ).toBe( 2 );
	} );

	it( 'awards 3 points for a backgammon', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			...makeCheckers( [
				{ player: PlayerType.PLAYER_TWO, lane: 25 }, // on bar
				...Array.from( { length: 14 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) ),
			] ),
		];
		const store = createTestStore( { checkers } );

		checkForWin( store.dispatch, checkers, PlayerType.PLAYER_ONE );

		expect( store.getState().scores[ PlayerType.PLAYER_ONE ] ).toBe( 3 );
	} );

	it( 'multiplies points by the cube value', () => {
		const checkers = [
			...allBornOff( PlayerType.PLAYER_ONE ),
			...makeCheckers(
				Array.from( { length: 15 }, () => ( {
					player: PlayerType.PLAYER_TWO,
					lane: 12,
				} ) )
			),
		];
		const store = createTestStore( { checkers } );

		// gammon (2) × cube 4 = 8
		checkForWin( store.dispatch, checkers, PlayerType.PLAYER_ONE, 4 );

		expect( store.getState().scores[ PlayerType.PLAYER_ONE ] ).toBe( 8 );
	} );

	it( 'does nothing when no player has won', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 5 },
			{ player: PlayerType.PLAYER_TWO, lane: 20 },
		] );
		const store = createTestStore( { checkers } );

		checkForWin( store.dispatch, checkers, PlayerType.PLAYER_ONE );

		expect( store.getState().gameOver ).toBe( false );
		expect( store.getState().scores[ PlayerType.PLAYER_ONE ] ).toBe( 0 );
	} );

	// Silence unused vi in case future seed mocks are needed
	void vi;
} );
