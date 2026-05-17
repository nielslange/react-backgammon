/**
 * Doubling cube tests.
 *
 * Cube starts at value=1, owner=null (centered), offered=false.
 *  - Either player may offer when they own the cube or it's centered.
 *  - Acceptor: cube doubles, ownership transfers, offered cleared.
 *  - Drop: offering player wins the current pre-double stake; game ends.
 */
import { describe, it, expect } from 'vitest';
import {
	offerDouble,
	acceptDouble,
	dropDouble,
} from '../../data/actions';
import { PlayerType } from '../../types';
import { createTestStore } from './test-utils';

describe( 'Doubling cube — offering', () => {
	it( 'starts centered with value 1, no owner, no offer', () => {
		const store = createTestStore();
		expect( store.getState().cube ).toEqual( {
			value: 1,
			owner: null,
			offered: false,
		} );
	} );

	it( 'offerDouble flips offered to true', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
		} );

		store.dispatch( offerDouble() );

		expect( store.getState().cube.offered ).toBe( true );
	} );
} );

describe( 'Doubling cube — accepting', () => {
	it( 'acceptDouble doubles the value, transfers ownership to acceptor, clears offered', () => {
		// P1 (current) offers; P2 (the other) accepts → P2 owns cube at value 2.
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			cube: { value: 1, owner: null, offered: true },
		} );

		store.dispatch( acceptDouble() );

		expect( store.getState().cube.value ).toBe( 2 );
		expect( store.getState().cube.owner ).toBe( PlayerType.PLAYER_TWO );
		expect( store.getState().cube.offered ).toBe( false );
	} );

	it( 'subsequent re-doubles double the value again', () => {
		// P2 owns cube at 2, offers; P1 accepts → P1 owns cube at 4.
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_TWO,
			cube: { value: 2, owner: PlayerType.PLAYER_TWO, offered: true },
		} );

		store.dispatch( acceptDouble() );

		expect( store.getState().cube.value ).toBe( 4 );
		expect( store.getState().cube.owner ).toBe( PlayerType.PLAYER_ONE );
	} );
} );

describe( 'Doubling cube — dropping', () => {
	it( 'dropDouble awards current pre-double stake to the offering player and ends game', () => {
		// P1 offers; P2 drops → P1 wins 1 (cube was 1).
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			cube: { value: 1, owner: null, offered: true },
		} );

		store.dispatch( dropDouble() );

		expect( store.getState().gameOver ).toBe( true );
		expect( store.getState().scores[ PlayerType.PLAYER_ONE ] ).toBe( 1 );
		expect( store.getState().scores[ PlayerType.PLAYER_TWO ] ).toBe( 0 );
		expect( store.getState().cube.offered ).toBe( false );
	} );

	it( 'drop awards the current cube value (e.g. 4) when later offered', () => {
		// Cube already escalated to 4; P2 offers, P1 drops.
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_TWO,
			cube: { value: 4, owner: PlayerType.PLAYER_TWO, offered: true },
		} );

		store.dispatch( dropDouble() );

		expect( store.getState().scores[ PlayerType.PLAYER_TWO ] ).toBe( 4 );
		expect( store.getState().gameOver ).toBe( true );
	} );
} );
