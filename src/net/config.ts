/**
 * Whether this build can play online. Next.js inlines NEXT_PUBLIC_* at
 * build time, so a deployment without Supabase keys simply offers no
 * online play instead of failing when someone tries it.
 */
export const onlineConfigured = (): boolean =>
	Boolean( process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY );
