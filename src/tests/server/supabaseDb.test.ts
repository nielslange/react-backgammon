// @vitest-environment node
/**
 * The Supabase adapter against the local stack (`npx supabase start`).
 * Skipped when it is not running, so CI without Docker stays green.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseDb } from '../../server/supabaseDb';
import { createRoom, joinRoom } from '../../server/rooms';
import { scripted } from '../../runtime/rng';
import { P1 } from '../engine/fixtures';
import { localStack } from './localStack';

const stack = await localStack();

describe.skipIf( ! stack )( 'supabaseDb against the local stack', () => {
	let service: SupabaseClient;
	let host: string;
	let guest: string;

	const anonymousUser = async () => {
		const client = createClient( stack!.url, stack!.anonKey, { auth: { persistSession: false } } );
		const { data, error } = await client.auth.signInAnonymously();
		if ( error || ! data.user ) throw error ?? new Error( 'no user' );
		return { id: data.user.id, client };
	};

	beforeAll( async () => {
		service = createClient( stack!.url, stack!.serviceKey, { auth: { persistSession: false } } );
		host = ( await anonymousUser() ).id;
		guest = ( await anonymousUser() ).id;
	} );

	it( 'creates and joins a room through Postgres', async () => {
		const db = supabaseDb( service );
		const { code } = await createRoom( db, host, { variant: 'backgammon', options: { cube: true }, matchTarget: 3, name: 'Host' } );
		const joined = await joinRoom( db, guest, { code, name: 'Guest' }, scripted( [ 6, 2 ] ) );
		const room = await db.roomByCode( code );
		expect( room ).toMatchObject( { guest, guest_name: 'Guest', status: 'playing', match_target: 3, options: { cube: true } } );
		const game = await db.gameById( joined.gameId );
		expect( game ).toMatchObject( { number: 1, version: 1, crawford_played: false } );
		expect( game!.snapshot ).toMatchObject( { phase: 'moving', player: P1, dice: [ 6, 2 ] } );
		expect( await db.movesAfter( joined.gameId, 0 ) ).toEqual( [
			{ game_id: joined.gameId, seq: 1, actor: null, kind: 'opening', payload: { rolls: [ [ 6, 2 ] ] } },
		] );
	} );

	it( 'reports a taken code, a taken seat and a stale version', async () => {
		const db = supabaseDb( service );
		const { code } = await createRoom( db, host, { variant: 'triktrak', options: {}, matchTarget: 1, name: 'Host' } );
		const room = ( await db.roomByCode( code ) )!;
		await expect(
			db.insertRoom( { code, variant: 'triktrak', options: {}, match_target: 1, host, host_name: 'X' } )
		).rejects.toMatchObject( { code: 'CODE_TAKEN' } );
		expect( await db.claimGuest( room.id, guest, 'G' ) ).toBe( true );
		expect( await db.claimGuest( room.id, host, 'H' ) ).toBe( false );
		const { gameId } = await joinRoom( db, guest, { code, name: 'G' } );
		const game = ( await db.gameById( gameId ) )!;
		await expect(
			db.applyMove( { gameId, seq: 1, actor: null, kind: 'roll', payload: {}, snapshot: game.snapshot } )
		).rejects.toMatchObject( { code: 'STALE_VERSION' } );
	} );

	it( 'lets players read their own room but not write moves', async () => {
		const db = supabaseDb( service );
		const player = await anonymousUser();
		const stranger = await anonymousUser();
		const { code } = await createRoom( db, player.id, { variant: 'backgammon', options: {}, matchTarget: 1, name: 'P' } );
		const own = await player.client.from( 'rooms' ).select( 'code' ).eq( 'code', code );
		expect( own.data ).toEqual( [ { code } ] );
		const other = await stranger.client.from( 'rooms' ).select( 'code' ).eq( 'code', code );
		expect( other.data ).toEqual( [] );
		const write = await player.client.from( 'rooms' ).update( { status: 'finished' } ).eq( 'code', code ).select();
		expect( write.data ?? [] ).toEqual( [] );
	} );
} );
