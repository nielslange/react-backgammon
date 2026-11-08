import type { Rng } from '../runtime/rng';

/** Server dice: a cryptographic source, so no client can predict a roll. */
export const cryptoRng: Rng = () => crypto.getRandomValues( new Uint32Array( 1 ) )[ 0 ] / 2 ** 32;
