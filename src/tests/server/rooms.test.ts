import { describe, expect, it } from 'vitest';
import { CODE_ALPHABET, generateCode } from '../../server/codes';
import { createRoom, joinRoom } from '../../server/rooms';
import { scripted, seeded } from '../../runtime/rng';
import { P1, P2 } from '../engine/fixtures';
import { memoryDb } from './memoryDb';

const HOST = 'user-host';
const GUEST = 'user-guest';

const open = async ( variant: 'backgammon' | 'triktrak' = 'backgammon' ) => {
	const store = memoryDb();
	const { code } = await createRoom( store.db, HOST, { variant, options: {}, matchTarget: 3, name: 'Niels' } );
	return { ...store, code };
};

describe( 'room codes', () => {
	it( 'are six characters without 0, O, 1 or I', () => {
		const rng = seeded( 3 );
		for ( let i = 0; i < 500; i++ ) {
			const code = generateCode( rng );
			expect( code ).toMatch( /^[A-HJ-NP-Z2-9]{6}$/ );
		}
		expect( CODE_ALPHABET ).toBe( 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' );
	} );
} );

describe( 'createRoom', () => {
	it( 'stores a waiting room with the host', async () => {
		const { rooms, code } = await open();
		expect( rooms ).toHaveLength( 1 );
		expect( rooms[ 0 ] ).toMatchObject( { code, host: HOST, host_name: 'Niels', guest: null, status: 'waiting', match_target: 3 } );
	} );

	it( 'tries another code when one is taken', async () => {
		const store = memoryDb();
		// The same seed twice produces the same first code.
		const first = await createRoom( store.db, HOST, { variant: 'backgammon', options: {}, matchTarget: 1, name: 'A' }, seeded( 1 ) );
		const second = await createRoom( store.db, HOST, { variant: 'backgammon', options: {}, matchTarget: 1, name: 'B' }, seeded( 1 ) );
		expect( second.code ).not.toBe( first.code );
	} );

	it( 'rejects an unknown variant, a bad match length and a missing sign-in', async () => {
		const { db } = memoryDb();
		await expect( createRoom( db, HOST, { variant: 'chess' as never, options: {}, matchTarget: 1, name: 'A' } ) ).rejects.toMatchObject( { code: 'UNKNOWN_VARIANT' } );
		await expect( createRoom( db, HOST, { variant: 'backgammon', options: {}, matchTarget: 0, name: 'A' } ) ).rejects.toMatchObject( { code: 'BAD_REQUEST' } );
		await expect( createRoom( db, null, { variant: 'backgammon', options: {}, matchTarget: 1, name: 'A' } ) ).rejects.toMatchObject( { code: 'NOT_SIGNED_IN' } );
	} );
} );

describe( 'joinRoom', () => {
	it( 'seats the guest as Dark, starts game 1 with the opening roll', async () => {
		const { db, rooms, games, moves, code } = await open();
		// 3-3 ties, then 5-2: Light starts with 5-2.
		const joined = await joinRoom( db, GUEST, { code, name: 'Guest' }, scripted( [ 3, 3, 5, 2 ] ) );
		expect( joined.seat ).toBe( P2 );
		expect( rooms[ 0 ] ).toMatchObject( { guest: GUEST, guest_name: 'Guest', status: 'playing' } );
		expect( games ).toHaveLength( 1 );
		expect( games[ 0 ] ).toMatchObject( { id: joined.gameId, number: 1, version: 1 } );
		expect( games[ 0 ].snapshot ).toMatchObject( { phase: 'moving', player: P1, dice: [ 5, 2 ] } );
		expect( moves ).toEqual( [
			{ game_id: joined.gameId, seq: 1, actor: null, kind: 'opening', payload: { rolls: [ [ 3, 3 ], [ 5, 2 ] ] } },
		] );
	} );

	it( 'accepts the codes in lower case', async () => {
		const { db, code } = await open();
		await expect( joinRoom( db, GUEST, { code: code.toLowerCase(), name: 'G' } ) ).resolves.toMatchObject( { seat: P2 } );
	} );

	it( 'lets the guest join again (reconnect) without a second game', async () => {
		const { db, games, code } = await open();
		const first = await joinRoom( db, GUEST, { code, name: 'G' } );
		const again = await joinRoom( db, GUEST, { code, name: 'G' } );
		expect( again.gameId ).toBe( first.gameId );
		expect( games ).toHaveLength( 1 );
	} );

	it( 'gives the host their seat instead of joining their own room as guest', async () => {
		const { db, code } = await open();
		await expect( joinRoom( db, HOST, { code, name: 'Niels' } ) ).rejects.toMatchObject( { code: 'OWN_ROOM' } );
	} );

	it( 'refuses a third player, an unknown code and a missing sign-in', async () => {
		const { db, code } = await open();
		await joinRoom( db, GUEST, { code, name: 'G' } );
		await expect( joinRoom( db, 'someone-else', { code, name: 'X' } ) ).rejects.toMatchObject( { code: 'ROOM_FULL' } );
		await expect( joinRoom( db, GUEST, { code: 'ZZZZZZ', name: 'G' } ) ).rejects.toMatchObject( { code: 'ROOM_NOT_FOUND' } );
		await expect( joinRoom( db, null, { code, name: 'G' } ) ).rejects.toMatchObject( { code: 'NOT_SIGNED_IN' } );
	} );

	it( 'starts Triktrak too', async () => {
		const { db, games, code } = await open( 'triktrak' );
		await joinRoom( db, GUEST, { code, name: 'G' }, scripted( [ 2, 4 ] ) );
		expect( games[ 0 ].snapshot.variant ).toBe( 'triktrak' );
		expect( games[ 0 ].snapshot.phase ).not.toBe( 'opening' );
	} );
} );

describe( 'describeRoom', () => {
	it( 'tells each visitor their role and what they may do', async () => {
		const { describeRoom } = await import( '../../server/rooms' );
		const { db, code } = await open();
		expect( await describeRoom( db, HOST, code.toLowerCase() ) ).toMatchObject( {
			code,
			role: 'host',
			status: 'waiting',
			hostName: 'Niels',
			guestName: null,
			variant: 'backgammon',
			matchTarget: 3,
			gameId: null,
		} );
		expect( await describeRoom( db, GUEST, code ) ).toMatchObject( { role: null, status: 'waiting' } );
		const { gameId } = await joinRoom( db, GUEST, { code, name: 'Guest' } );
		expect( await describeRoom( db, GUEST, code ) ).toMatchObject( { role: 'guest', status: 'playing', gameId, guestName: 'Guest' } );
		expect( await describeRoom( db, 'someone', code ) ).toMatchObject( { role: null, status: 'playing' } );
		await expect( describeRoom( db, HOST, 'ZZZZZZ' ) ).rejects.toMatchObject( { code: 'ROOM_NOT_FOUND' } );
		// Visitors who are not players never see the internal ids of the game.
		expect( ( await describeRoom( db, 'someone', code ) ).gameId ).toBeNull();
	} );
} );
