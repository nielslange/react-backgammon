/**
 * Bear-off rules:
 *
 *  - Eligibility: only when ALL 15 checkers are in the home board (and none on the bar).
 *  - Exact roll bears off the checker on point N.
 *  - Overshoot bears off the highest occupied point only when no higher checker exists.
 *  - Hit during bear-off → must re-enter and bring back into home board first.
 */
import { describe, it, expect } from 'vitest';
import { PlayerType } from '../../types';
import {
	wouldClearOffChecker,
	hasCheckersOutsideHomeBoard,
} from '../../data/selectors';
import { makeCheckers } from './test-utils';

describe( 'Bear-off eligibility (hasCheckersOutsideHomeBoard)', () => {
	it( 'P1 cannot bear off if ANY checker is on the bar (lane 0)', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 0 }, // bar
			{ player: PlayerType.PLAYER_ONE, lane: 1 },
			{ player: PlayerType.PLAYER_ONE, lane: 6 },
		] );
		expect(
			hasCheckersOutsideHomeBoard( {
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
			} )
		).toBe( true );
	} );

	it( 'P1 cannot bear off if ANY checker is outside lanes 1-6', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 7 },
			{ player: PlayerType.PLAYER_ONE, lane: 1 },
		] );
		expect(
			hasCheckersOutsideHomeBoard( {
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
			} )
		).toBe( true );
	} );

	it( 'P1 can bear off when all checkers are in lanes 1-6', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 1 },
			{ player: PlayerType.PLAYER_ONE, lane: 6 },
		] );
		expect(
			hasCheckersOutsideHomeBoard( {
				checkers,
				currentPlayer: PlayerType.PLAYER_ONE,
			} )
		).toBe( false );
	} );

	it( 'P2 cannot bear off if ANY checker is on the bar (lane 25)', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_TWO, lane: 25 }, // bar
			{ player: PlayerType.PLAYER_TWO, lane: 19 },
		] );
		expect(
			hasCheckersOutsideHomeBoard( {
				checkers,
				currentPlayer: PlayerType.PLAYER_TWO,
			} )
		).toBe( true );
	} );

	it( 'P2 can bear off when all checkers are in lanes 19-24', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_TWO, lane: 19 },
			{ player: PlayerType.PLAYER_TWO, lane: 24 },
		] );
		expect(
			hasCheckersOutsideHomeBoard( {
				checkers,
				currentPlayer: PlayerType.PLAYER_TWO,
			} )
		).toBe( false );
	} );
} );

describe( 'Bear-off exact roll (wouldClearOffChecker)', () => {
	it( 'P1 die 6 bears off lane 6 exactly', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 6 },
			{ player: PlayerType.PLAYER_ONE, lane: 3 },
		] );
		expect(
			wouldClearOffChecker( {
				die: 6,
				lane: 6,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );
	} );

	it( 'P1 die 3 from lane 3 bears off (3 - 3 = 0)', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 3 },
		] );
		expect(
			wouldClearOffChecker( {
				die: 3,
				lane: 3,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );
	} );

	it( 'P2 die 1 from lane 24 bears off (24 + 1 = 25)', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_TWO, lane: 24 },
		] );
		expect(
			wouldClearOffChecker( {
				die: 1,
				lane: 24,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers,
			} )
		).toBe( true );
	} );
} );

describe( 'Bear-off overshoot rule', () => {
	it( 'P1: cannot use die 6 to bear off lane 4 if a checker is on lane 5 or 6', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 4 },
			{ player: PlayerType.PLAYER_ONE, lane: 5 }, // higher checker exists
		] );
		expect(
			wouldClearOffChecker( {
				die: 6,
				lane: 4,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( false );
	} );

	it( 'P1: can use die 6 to bear off lane 4 when no higher checkers exist', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_ONE, lane: 4 },
			{ player: PlayerType.PLAYER_ONE, lane: 2 },
		] );
		expect(
			wouldClearOffChecker( {
				die: 6,
				lane: 4,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers,
			} )
		).toBe( true );
	} );

	it( 'P2: cannot use die 6 to bear off lane 21 if a checker is on lane 22 or 23', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_TWO, lane: 21 },
			{ player: PlayerType.PLAYER_TWO, lane: 22 }, // higher (closer to 24)
		] );
		expect(
			wouldClearOffChecker( {
				die: 6,
				lane: 21,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers,
			} )
		).toBe( false );
	} );

	it( 'P2: can use die 6 to bear off lane 21 when no higher checkers exist', () => {
		const checkers = makeCheckers( [
			{ player: PlayerType.PLAYER_TWO, lane: 21 },
			{ player: PlayerType.PLAYER_TWO, lane: 19 },
		] );
		expect(
			wouldClearOffChecker( {
				die: 6,
				lane: 21,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers,
			} )
		).toBe( true );
	} );
} );

describe( 'Bear-off must come from home board', () => {
	it( 'P1: wouldClearOffChecker is false for source lane 7+', () => {
		expect(
			wouldClearOffChecker( {
				die: 6,
				lane: 7,
				currentPlayer: PlayerType.PLAYER_ONE,
				checkers: [],
			} )
		).toBe( false );
	} );

	it( 'P2: wouldClearOffChecker is false for source lane ≤ 18', () => {
		expect(
			wouldClearOffChecker( {
				die: 6,
				lane: 18,
				currentPlayer: PlayerType.PLAYER_TWO,
				checkers: [],
			} )
		).toBe( false );
	} );
} );

describe( 'Bear-off click-flow integration', () => {
	// User-reported bug: "I think it's possible to move checkers out of the
	// game even though not all checkers are in the end zone." This test
	// drives the actual click handler to prove the rule is enforced.
	it( 'rejects bear-off click when a checker is still outside home', async () => {
		const { handleClick } = await import(
			'../../helpers/handleClickHelper'
		);
		const { MessageType } = await import( '../../types' );

		const dispatched: any[] = [];
		const dispatch = ( a: any ) => {
			dispatched.push( a );
			return a;
		};

		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 6 }, // home
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 13 }, // outside
		] );

		const event = {
			target: {
				closest: () => ( { dataset: { lane: '6' } } ),
			},
		};
		handleClick( event, {
			id: 1,
			player: PlayerType.PLAYER_ONE,
			dice: [ 6 ],
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
			die: 6,
			dispatch,
		} );

		const notice = dispatched.find( ( a ) => a.type === 'SET_NOTICE' );
		expect( notice ).toBeDefined();
		expect( notice.notice.message ).toBe(
			MessageType.NOT_ALL_CHECKERS_IN_END_ZONE
		);
	} );

	it( 'allows bear-off click when all checkers are in home', async () => {
		const { handleClick } = await import(
			'../../helpers/handleClickHelper'
		);

		const dispatched: any[] = [];
		const dispatch = ( a: any ) => {
			dispatched.push( a );
			return a;
		};

		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 6 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 },
		] );

		const event = {
			target: {
				closest: () => ( { dataset: { lane: '6' } } ),
			},
		};
		handleClick( event, {
			id: 1,
			player: PlayerType.PLAYER_ONE,
			dice: [ 6 ],
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
			die: 6,
			dispatch,
		} );

		// MOVE_CHECKER means the move went through.
		expect(
			dispatched.some( ( a ) => a.type === 'MOVE_CHECKER' )
		).toBe( true );
	} );
} );
