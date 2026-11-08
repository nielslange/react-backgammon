/**
 * How likely a blot is to be hit: of the 36 rolls, how many let a shooter
 * `distance` pips away land on it, directly or by combining the dice, when
 * the points listed in `blocked` (as distances from the shooter) cannot be
 * used as stopovers.
 */
const cache = new Map< string, number >();

const hits = ( a: number, b: number, distance: number, blocked: Set< number > ): boolean => {
	if ( a === distance || b === distance ) return true;
	if ( a !== b ) {
		if ( a + b !== distance ) return false;
		// Either die may be played first; one open stopover is enough.
		return ! blocked.has( a ) || ! blocked.has( b );
	}
	// Doubles: up to four moves of the same size, every stopover open.
	for ( let k = 2; k <= 4; k++ ) {
		if ( a * k !== distance ) continue;
		for ( let s = 1; s < k; s++ ) if ( blocked.has( a * s ) ) return false;
		return true;
	}
	return false;
};

/** Number of rolls out of 36 that hit at this distance. */
export const shotCount = ( distance: number, blocked: Set< number > ): number => {
	if ( distance < 1 || distance > 24 ) return 0;
	const key = `${ distance }:${ [ ...blocked ].sort( ( x, y ) => x - y ).join( ',' ) }`;
	const cached = cache.get( key );
	if ( cached !== undefined ) return cached;
	let count = 0;
	for ( let a = 1; a <= 6; a++ ) {
		for ( let b = 1; b <= 6; b++ ) {
			if ( hits( a, b, distance, blocked ) ) count++;
		}
	}
	cache.set( key, count );
	return count;
};

export const hitProbability = ( distance: number, blocked: Set< number > ): number =>
	shotCount( distance, blocked ) / 36;
