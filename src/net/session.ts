'use client';

/**
 * Every online player is an anonymous Supabase user. The session lives in
 * cookies, so the Server Actions see the same user as the browser.
 */
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type AuthClient = Pick< SupabaseClient, 'auth' >;

// One sign-in per client, even when several components ask at once.
const pending = new WeakMap< AuthClient, Promise< string > >();

export const ensureSession = ( client: AuthClient ): Promise< string > => {
	const running = pending.get( client );
	if ( running ) return running;
	const task = ( async () => {
		const { data } = await client.auth.getSession();
		if ( data.session ) return data.session.user.id;
		const signedIn = await client.auth.signInAnonymously();
		if ( signedIn.error || ! signedIn.data.user ) {
			throw signedIn.error ?? new Error( 'Anonymous sign-in failed.' );
		}
		return signedIn.data.user.id;
	} )();
	pending.set( client, task );
	// A failed attempt may be retried.
	task.catch( () => pending.delete( client ) );
	return task;
};

/** The visitor's user id once signed in; null until then. */
export const useSession = ( client: AuthClient ): string | null => {
	const [ userId, setUserId ] = useState< string | null >( null );
	useEffect( () => {
		let live = true;
		ensureSession( client )
			.then( ( id ) => live && setUserId( id ) )
			.catch( () => {} );
		return () => {
			live = false;
		};
	}, [ client ] );
	return userId;
};
