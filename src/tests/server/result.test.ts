import { describe, expect, it, vi } from 'vitest';
import { EngineError } from '../../engine/errors';
import { ServerError } from '../../server/errors';
import { toResult } from '../../server/result';

describe( 'toResult', () => {
	it( 'wraps a value', async () => {
		await expect( toResult( async () => ( { code: 'ABCDEF' } ) ) ).resolves.toEqual( { ok: true, value: { code: 'ABCDEF' } } );
	} );

	it( 'passes refusals through as codes', async () => {
		await expect( toResult( async () => { throw new ServerError( 'ROOM_FULL' ); } ) ).resolves.toEqual( { ok: false, code: 'ROOM_FULL' } );
		await expect( toResult( async () => { throw new EngineError( 'ILLEGAL_STEP' ); } ) ).resolves.toEqual( { ok: false, code: 'ILLEGAL_STEP' } );
	} );

	it( 'hides unexpected errors behind SERVER_ERROR and logs them', async () => {
		const log = vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		await expect( toResult( async () => { throw new Error( 'secret detail' ); } ) ).resolves.toEqual( { ok: false, code: 'SERVER_ERROR' } );
		expect( log ).toHaveBeenCalled();
		log.mockRestore();
	} );
} );
