import type { Roll } from '../types';

export const isDouble = ( [ a, b ]: Roll ): boolean => a === b;

/** The 1-2 roll, "tric trac". */
export const isTricTrac = ( [ a, b ]: Roll ): boolean =>
	Math.min( a, b ) === 1 && Math.max( a, b ) === 2;

/**
 * Dice to play, in order: doubles n, n, 7−n, 7−n; tric trac
 * 1, 1, 2, 2, 5, 5, 6, 6; anything else high die first.
 */
export const expandRoll = ( roll: Roll ): number[] => {
	const [ a, b ] = roll;
	if ( isTricTrac( roll ) ) return [ 1, 1, 2, 2, 5, 5, 6, 6 ];
	if ( isDouble( roll ) ) return [ a, a, 7 - a, 7 - a ];
	return [ Math.max( a, b ), Math.min( a, b ) ];
};
