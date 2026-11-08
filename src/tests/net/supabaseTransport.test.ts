// @vitest-environment node
/** Realtime and presence through the local stack; skipped without it. */
import { afterAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEngine } from '../../engine';
import type { LoggedMove } from '../../net/protocol';
import { createSupabaseTransport } from '../../net/supabaseTransport';
import { submitMove } from '../../server/moves';
import { createRoom, joinRoom } from '../../server/rooms';
import { supabaseDb } from '../../server/supabaseDb';
import { scripted } from '../../runtime/rng';
import { localStack } from '../server/localStack';

const stack = await localStack();

const until = async ( check: () => boolean, ms = 15000 ) => {
	const start = Date.now();
	while ( ! check() ) {
		if ( Date.now() - start > ms ) throw new Error( 'timed out' );
		await new Promise( ( r ) => setTimeout( r, 50 ) );
	}
};

describe.skipIf( ! stack )(
	'the Supabase transport against the local stack',
	() => {
		const clients: SupabaseClient[] = [];
		const player = async () => {
			const client = createClient( stack!.url, stack!.anonKey, {
				auth: { persistSession: false },
			} );
			const { data } = await client.auth.signInAnonymously();
			clients.push( client );
			return { client, id: data.user!.id };
		};
		afterAll( async () => {
			for ( const c of clients ) await c.removeAllChannels();
		} );

		const noActions = {
			createRoom: async () => ( {
				ok: false as const,
				code: 'SERVER_ERROR' as const,
			} ),
			joinRoom: async () => ( {
				ok: false as const,
				code: 'SERVER_ERROR' as const,
			} ),
			rematch: async () => ( {
				ok: false as const,
				code: 'SERVER_ERROR' as const,
			} ),
			describeRoom: async () => ( {
				ok: false as const,
				code: 'SERVER_ERROR' as const,
			} ),
			submitMove: async () => ( {
				ok: false as const,
				code: 'SERVER_ERROR' as const,
			} ),
		};

		it( 'delivers the opponent’s move live and reads the game through row-level security', async () => {
			const host = await player();
			const guest = await player();
			const db = supabaseDb(
				createClient( stack!.url, stack!.serviceKey, {
					auth: { persistSession: false },
				} )
			);
			const { code } = await createRoom( db, host.id, {
				variant: 'backgammon',
				options: { cube: false },
				matchTarget: 1,
				name: 'H',
			} );
			const { gameId } = await joinRoom(
				db,
				guest.id,
				{ code, name: 'G' },
				scripted( [ 1, 6 ] )
			);

			const transport = createSupabaseTransport( host.client, noActions );
			const received: LoggedMove[] = [];
			const stop = await transport.subscribe( gameId, ( m ) =>
				received.push( m )
			);

			const game = await transport.loadGame( gameId );
			expect( game.version ).toBe( 1 );
			expect( await transport.movesAfter( gameId, 0 ) ).toHaveLength( 1 );

			// Dark (the guest) won the opening; their step reaches the host live.
			const step = getEngine( 'backgammon' ).legalSteps(
				game.snapshot
			)[ 0 ];
			await submitMove( db, guest.id, {
				gameId,
				kind: 'step',
				payload: { step },
				version: 1,
			} );
			// Delivery is at least once and may include rows written just before
			// subscribing (here the opening); sync ignores those by sequence number.
			await until( () => received.some( ( m ) => m.seq === 2 ) );
			expect( received.find( ( m ) => m.seq === 2 ) ).toMatchObject( {
				kind: 'step',
			} );
			stop();

			// A stranger reads nothing.
			const stranger = await player();
			await expect(
				createSupabaseTransport( stranger.client, noActions ).loadGame(
					gameId
				)
			).rejects.toMatchObject( {
				code: 'GAME_NOT_FOUND',
			} );
		}, 30000 );

		it( 'shows who is in the room', async () => {
			const host = await player();
			const guest = await player();
			const roomId = `test-${ Date.now() }`;
			const seen: string[][] = [];
			const a = createSupabaseTransport(
				host.client,
				noActions
			).presence( roomId, host.id );
			a.onChange( ( online ) => seen.push( online ) );
			const b = createSupabaseTransport(
				guest.client,
				noActions
			).presence( roomId, guest.id );
			await until( () =>
				seen.some(
					( list ) =>
						list.includes( guest.id ) && list.includes( host.id )
				)
			);
			b.leave();
			await until( () => seen.at( -1 )!.length === 1 );
			a.leave();
		}, 30000 );
	}
);
