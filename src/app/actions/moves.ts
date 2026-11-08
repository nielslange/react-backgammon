'use server';

/** Server Action for moves: the signed-in player, validated and stored. */
import { createServiceClient, currentUserId } from '../../lib/supabase/server';
import { submitMove as submit, type SubmitInput } from '../../server/moves';
import { toResult, type Result } from '../../server/result';
import { supabaseDb } from '../../server/supabaseDb';

export const submitMove = async (
	input: SubmitInput
): Promise< Result< { version: number } > > =>
	toResult( async () =>
		submit(
			supabaseDb( createServiceClient() ),
			await currentUserId(),
			input
		)
	);
