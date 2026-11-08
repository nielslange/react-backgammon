export type EngineErrorCode =
	| 'WRONG_PHASE'
	| 'NOT_YOUR_TURN'
	| 'ILLEGAL_STEP'
	| 'NOTHING_TO_UNDO'
	| 'CUBE_NOT_ALLOWED'
	| 'INVALID_POSITION';

/**
 * Thrown by every engine function on an illegal call. The Redux layer
 * stores `code`; a Server Action returns it as `{ ok: false, code }`.
 */
export class EngineError extends Error {
	readonly code: EngineErrorCode;

	constructor( code: EngineErrorCode, message?: string ) {
		super( message ?? code );
		this.name = 'EngineError';
		this.code = code;
	}
}
