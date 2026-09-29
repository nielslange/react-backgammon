import { describe, it, expect } from 'vitest';
import { calculatePipCount } from '../../data/selectors';
import { PlayerType } from '../../types';
import startCheckers from '../../data/checkers-start.json';

describe( 'calculatePipCount', () => {
	it( 'is 167 for both players in the starting position', () => {
		const checkers = startCheckers as any;
		expect(
			calculatePipCount( { checkers, player: PlayerType.PLAYER_ONE } )
		).toBe( 167 );
		expect(
			calculatePipCount( { checkers, player: PlayerType.PLAYER_TWO } )
		).toBe( 167 );
	} );

	it( 'P1 on lane N needs N pips (moves 24→1)', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 24 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 1 },
		];
		expect(
			calculatePipCount( { checkers, player: PlayerType.PLAYER_ONE } )
		).toBe( 25 );
	} );

	it( 'P2 on lane N needs 25 - N pips (moves 1→24)', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 1 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 24 },
		];
		expect(
			calculatePipCount( { checkers, player: PlayerType.PLAYER_TWO } )
		).toBe( 25 );
	} );

	it( 'counts 25 for a checker on the bar and 0 for a borne-off checker', () => {
		const checkers = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 }, // P1 bar
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 25 }, // P1 off
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 25 }, // P2 bar
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 0 }, // P2 off
		];
		expect(
			calculatePipCount( { checkers, player: PlayerType.PLAYER_ONE } )
		).toBe( 25 );
		expect(
			calculatePipCount( { checkers, player: PlayerType.PLAYER_TWO } )
		).toBe( 25 );
	} );

	it( 'pip count decreases by the die value after a normal move', () => {
		const before = [ { id: 1, player: PlayerType.PLAYER_ONE, lane: 13 } ];
		const after = [ { id: 1, player: PlayerType.PLAYER_ONE, lane: 8 } ];
		const diff =
			calculatePipCount( {
				checkers: before,
				player: PlayerType.PLAYER_ONE,
			} ) -
			calculatePipCount( {
				checkers: after,
				player: PlayerType.PLAYER_ONE,
			} );
		expect( diff ).toBe( 5 );
	} );
} );
