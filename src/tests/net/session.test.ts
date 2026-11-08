import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ensureSession, useSession } from '../../net/session';

const fakeClient = ( session: { user: { id: string } } | null ) => {
	const signInAnonymously = vi.fn( async () => ( {
		data: { user: { id: 'new-user' } },
		error: null,
	} ) );
	return {
		signInAnonymously,
		client: {
			auth: {
				getSession: vi.fn( async () => ( {
					data: { session },
					error: null,
				} ) ),
				signInAnonymously,
			},
		},
	};
};

describe( 'anonymous sessions', () => {
	it( 'signs in anonymously when there is no session', async () => {
		const { client, signInAnonymously } = fakeClient( null );
		await expect( ensureSession( client as never ) ).resolves.toBe(
			'new-user'
		);
		expect( signInAnonymously ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps an existing session', async () => {
		const { client, signInAnonymously } = fakeClient( {
			user: { id: 'me' },
		} );
		await expect( ensureSession( client as never ) ).resolves.toBe( 'me' );
		expect( signInAnonymously ).not.toHaveBeenCalled();
	} );

	it( 'signs in once even when the hook renders twice at the same time', async () => {
		const { client, signInAnonymously } = fakeClient( null );
		const a = renderHook( () => useSession( client as never ) );
		const b = renderHook( () => useSession( client as never ) );
		await waitFor( () => expect( a.result.current ).toBe( 'new-user' ) );
		await waitFor( () => expect( b.result.current ).toBe( 'new-user' ) );
		expect( signInAnonymously ).toHaveBeenCalledTimes( 1 );
	} );
} );
