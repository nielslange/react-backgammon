/**
 * Connection details of the local Supabase stack, or null when it is not
 * running. The keys are the CLI's fixed local demo keys (not secrets);
 * environment variables override them.
 */
const DEMO_ANON =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const DEMO_SERVICE =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export type LocalStack = { url: string; anonKey: string; serviceKey: string };

export const localStack = async (): Promise< LocalStack | null > => {
	const url = process.env.LOCAL_SUPABASE_URL ?? 'http://127.0.0.1:54321';
	try {
		const res = await fetch( `${ url }/auth/v1/health`, { headers: { apikey: DEMO_ANON }, signal: AbortSignal.timeout( 1000 ) } );
		if ( ! res.ok ) return null;
	} catch {
		return null;
	}
	return {
		url,
		anonKey: process.env.LOCAL_SUPABASE_ANON_KEY ?? DEMO_ANON,
		serviceKey: process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY ?? DEMO_SERVICE,
	};
};
