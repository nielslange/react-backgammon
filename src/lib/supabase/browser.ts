'use client';

/** The browser's Supabase client: anonymous sign-in, reads and Realtime. */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './env';

let client: SupabaseClient | null = null;

export const getBrowserClient = (): SupabaseClient => {
	client ??= createBrowserClient( supabaseUrl(), supabaseAnonKey() );
	return client;
};
