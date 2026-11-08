/** Reads a required environment variable, naming it when it is missing. */
export const requireEnv = ( name: string, value: string | undefined ): string => {
	if ( ! value ) throw new Error( `${ name } is not set. See .env.example.` );
	return value;
};

// Next.js inlines NEXT_PUBLIC_* only when written out literally.
export const supabaseUrl = () => requireEnv( 'NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL );
export const supabaseAnonKey = () =>
	requireEnv( 'NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY );
