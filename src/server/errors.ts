import type { EngineErrorCode } from '../engine/errors';

export type ServerErrorCode =
	| EngineErrorCode
	| 'NOT_SIGNED_IN'
	| 'BAD_REQUEST'
	| 'ROOM_NOT_FOUND'
	| 'ROOM_FULL'
	| 'OWN_ROOM'
	| 'NOT_A_PLAYER'
	| 'CODE_TAKEN'
	| 'GAME_NOT_FOUND'
	| 'STALE_VERSION'
	| 'GAME_NOT_OVER'
	| 'MATCH_OVER'
	| 'SERVER_ERROR';

/** A refusal the Server Actions return as `{ ok: false, code }`. */
export class ServerError extends Error {
	readonly code: ServerErrorCode;

	constructor( code: ServerErrorCode, message?: string ) {
		super( message ?? code );
		this.name = 'ServerError';
		this.code = code;
	}
}

export const requireUser = ( userId: string | null ): string => {
	if ( ! userId ) throw new ServerError( 'NOT_SIGNED_IN' );
	return userId;
};
