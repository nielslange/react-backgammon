import { describe, expect, it } from 'vitest';
import { hitProbability, shotCount } from '../../ai/shots';

describe( 'shot table', () => {
	it( 'matches the standard counts out of 36 for an open board', () => {
		const expected: Record< number, number > = {
			1: 11, 2: 12, 3: 14, 4: 15, 5: 15, 6: 17,
			7: 6, 8: 6, 9: 5, 10: 3, 11: 2, 12: 3,
			15: 1, 16: 1, 18: 1, 20: 1, 24: 1,
			13: 0, 14: 0, 17: 0, 19: 0, 21: 0, 22: 0, 23: 0,
		};
		for ( const [ d, count ] of Object.entries( expected ) ) {
			expect( shotCount( Number( d ), new Set() ) ).toBe( count );
		}
	} );

	it( 'returns a probability', () => {
		expect( hitProbability( 6, new Set() ) ).toBeCloseTo( 17 / 36 );
		expect( hitProbability( 12, new Set() ) ).toBeCloseTo( 3 / 36 );
		expect( hitProbability( 0, new Set() ) ).toBe( 0 );
		expect( hitProbability( 25, new Set() ) ).toBe( 0 );
	} );

	it( 'blocked intermediate points cut combination shots', () => {
		// Distance 7: 6-1, 1-6, 5-2, 2-5, 4-3, 3-4. Blocking 1 and 6 kills 6-1 both ways.
		expect( shotCount( 7, new Set( [ 1, 6 ] ) ) ).toBe( 4 );
		// Distance 8 open: 6-2, 2-6, 5-3, 3-5, 4-4, 2-2. Blocking 4 kills 4-4 and 2-2 (via 4).
		expect( shotCount( 8, new Set( [ 4 ] ) ) ).toBe( 4 );
		// Direct shots are never blocked.
		expect( shotCount( 3, new Set( [ 1, 2 ] ) ) ).toBe( 11 );
	} );
} );
