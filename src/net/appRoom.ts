'use client';

/**
 * The real backend for the room page: Supabase in the browser for sign-in,
 * reads and live updates, the Server Actions for every write.
 */
import { createRoom, describeRoom, joinRoom, rematch } from '../app/actions/rooms';
import { submitMove } from '../app/actions/moves';
import type { AppStore } from '../data/createStore';
import { onlineHolderOf } from '../data/store';
import { getBrowserClient } from '../lib/supabase/browser';
import { ensureSession } from './session';
import { createSupabaseTransport } from './supabaseTransport';
import type { Transport } from './transport';
import type { RoomDeps } from './useRoom';

let transport: Transport | null = null;

export const appTransport = (): Transport => {
	transport ??= createSupabaseTransport( getBrowserClient(), {
		createRoom,
		joinRoom,
		describeRoom,
		rematch,
		submitMove,
	} );
	return transport;
};

export const signIn = () => ensureSession( getBrowserClient() );

export const appRoomDeps = ( store: AppStore ): RoomDeps => ( {
	transport: appTransport(),
	signIn,
	holder: onlineHolderOf( store ),
} );
