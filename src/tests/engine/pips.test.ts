import { describe, expect, it } from 'vitest';
import { pipCount } from '../../engine/backgammon/pips';
import startCheckers from '../../data/checkers-start.json';
import type { Checker } from '../../engine/types';
import { P1, P2, pos } from './fixtures';

describe( 'pipCount', () => {
	it( 'is 167 for both players in the starting position', () => {
		const checkers = startCheckers as Checker[];
		expect( pipCount( checkers, P1 ) ).toBe( 167 );
		expect( pipCount( checkers, P2 ) ).toBe( 167 );
	} );
	it( 'P1 on lane N needs N pips', () => {
		const checkers = pos( [
			{ player: P1, lane: 24, count: 1 },
			{ player: P1, lane: 1, count: 1 },
		] );
		expect( pipCount( checkers, P1 ) ).toBe( 25 );
	} );
	it( 'P2 on lane N needs 25 - N pips', () => {
		const checkers = pos( [
			{ player: P2, lane: 1, count: 1 },
			{ player: P2, lane: 24, count: 1 },
		] );
		expect( pipCount( checkers, P2 ) ).toBe( 25 );
	} );
	it( 'counts 25 for a checker on the bar and 0 for a borne-off checker', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P1, lane: 25, count: 1 },
			{ player: P2, lane: 25, count: 1 },
			{ player: P2, lane: 0, count: 1 },
		] );
		expect( pipCount( checkers, P1 ) ).toBe( 25 );
		expect( pipCount( checkers, P2 ) ).toBe( 25 );
	} );
	it( 'decreases by the die value after a normal move', () => {
		const before = pos( [ { player: P1, lane: 13, count: 1 } ] );
		const after = pos( [ { player: P1, lane: 8, count: 1 } ] );
		expect( pipCount( before, P1 ) - pipCount( after, P1 ) ).toBe( 5 );
	} );
} );
