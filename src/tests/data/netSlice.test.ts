import { describe, expect, it } from 'vitest';
import { makeStore } from '../../data/createStore';
import {
	joinedRoom,
	leftRoom,
	opponentPresence,
	roomStatus,
	syncedVersion,
} from '../../data/netSlice';
import { P1 } from '../engine/fixtures';

describe( 'the net slice', () => {
	it( 'is empty offline, tracks a room while online, and clears on leaving', () => {
		const store = makeStore();
		expect( store.getState().net ).toBeNull();
		store.dispatch(
			joinedRoom( {
				roomCode: 'ABCDEF',
				roomId: 'r1',
				gameId: 'g1',
				role: 'host',
				seat: P1,
				status: 'waiting',
				version: 0,
			} )
		);
		store.dispatch( opponentPresence( true ) );
		store.dispatch( roomStatus( 'playing' ) );
		store.dispatch( syncedVersion( 7 ) );
		expect( store.getState().net ).toEqual( {
			roomCode: 'ABCDEF',
			roomId: 'r1',
			gameId: 'g1',
			role: 'host',
			seat: P1,
			status: 'playing',
			opponentOnline: true,
			version: 7,
		} );
		store.dispatch( leftRoom() );
		expect( store.getState().net ).toBeNull();
	} );

	it( 'ignores updates without a room', () => {
		const store = makeStore();
		store.dispatch( opponentPresence( true ) );
		store.dispatch( syncedVersion( 3 ) );
		expect( store.getState().net ).toBeNull();
	} );
} );
