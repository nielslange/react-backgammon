/**
 * Server-side Supabase clients. Only Server Actions and server components
 * import this file; the service-role key has no NEXT_PUBLIC_ prefix, so it
 * never reaches the browser bundle.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requireEnv, supabaseAnonKey, supabaseUrl } from './env';

/** The visitor's own session, read from the cookies @supabase/ssr sets. */
export const createUserClient = async (): Promise< SupabaseClient > => {
	const store = await cookies();
	return createServerClient( supabaseUrl(), supabaseAnonKey(), {
		cookies: {
			getAll: () => store.getAll(),
			setAll: ( list ) => {
				try {
					for ( const { name, value, options } of list ) store.set( name, value, options );
				} catch {
					// Called from a server component, where cookies are read-only.
				}
			},
		},
	} );
};

/** The id of the signed-in (anonymous) visitor, or null. */
export const currentUserId = async (): Promise< string | null > => {
	const { data } = await ( await createUserClient() ).auth.getUser();
	return data.user?.id ?? null;
};

/** Bypasses row-level security: all writes go through this client. */
export const createServiceClient = (): SupabaseClient =>
	createClient(
		supabaseUrl(),
		requireEnv( 'SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY ),
		{ auth: { persistSession: false, autoRefreshToken: false } }
	);
