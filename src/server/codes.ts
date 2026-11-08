import type { Rng } from '../runtime/rng';

/** No 0/O or 1/I, so codes survive being read out loud. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

export const generateCode = ( rng: Rng ): string =>
	Array.from( { length: CODE_LENGTH }, () => CODE_ALPHABET[ Math.floor( rng() * CODE_ALPHABET.length ) ] ).join( '' );

export const normaliseCode = ( code: string ): string => code.trim().toUpperCase();
