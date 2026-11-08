import { EngineError } from '../engine/errors';
import { ServerError, type ServerErrorCode } from './errors';

export type Result< T > = { ok: true; value: T } | { ok: false; code: ServerErrorCode };

/** Runs server logic; refusals become codes, anything else SERVER_ERROR. */
export const toResult = async < T >( run: () => Promise< T > ): Promise< Result< T > > => {
	try {
		return { ok: true, value: await run() };
	} catch ( error ) {
		if ( error instanceof ServerError || error instanceof EngineError ) return { ok: false, code: error.code };
		console.error( error );
		return { ok: false, code: 'SERVER_ERROR' };
	}
};
