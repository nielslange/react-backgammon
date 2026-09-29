// @vitest-environment jsdom
/**
 * Turn-flow rules that were missing or wrong:
 *  - a player must play the maximum number of dice possible (checker choice)
 *  - a turn ends automatically when the remaining dice cannot be played
 *  - the opponent gets no roll after the winning move
 *  - no moves are accepted once the game is over
 *  - a completed turn cannot be undone by the opponent
 *  - the opening roll decides who starts
 */
import { describe, it, expect, vi } from 'vitest';
import { handleClick } from '../../helpers/handleClickHelper';
import { updateGame } from '../../helpers/updateGameHelper';
import { startGame } from '../../helpers/startGameHelper';
import { createNotice } from '../../helpers/createNoticeHelper';
import {
	acceptDouble,
	moveChecker,
	offerDouble,
	surrenderGame,
	toggleCurrentPlayer,
	undoMove,
} from '../../data/actions';
import { MessageType, NoticeStatusType, PlayerType } from '../../types';
import type { CheckerType } from '../../types';
import { createTestStore, makeCheckers, padToFifteen } from './test-utils';

const eventForLane = ( lane: number ) => ( {
	target: {
		closest: vi.fn().mockReturnValue( {
			dataset: { lane: String( lane ) },
		} ),
	},
} );

const click = (
	store: ReturnType< typeof createTestStore >,
	{ id, lane }: { id: number; lane: number }
) => {
	const state = store.getState();
	handleClick( eventForLane( lane ), {
		id,
		player: state.currentPlayer,
		dice: state.dice,
		currentPlayer: state.currentPlayer,
		checkers: state.checkers,
		die: state.dice[ 0 ],
		dispatch: store.dispatch,
		gameOver: state.gameOver,
		cubeValue: state.cube.value,
	} );
};

describe( 'Must play the maximum number of dice', () => {
	it( 'rejects a checker choice that would forfeit a playable die', () => {
		// P1 rolls [3, 5]. P1 has checkers on 14, 12 and 24.
		// P2 blocks lanes 4, 6, 7, 19 and 21.
		//   Checker on 24: 24-3=21 ✗, 24-5=19 ✗ → immobile.
		//   Checker on 12: 12-3=9 ✓, 12-5=7 ✗.
		//   Checker on 14: 14-3=11 ✓, 14-5=9 ✓.
		// Two-dice sequences: 14→9 then 12→9, or 12→9 then 14→9.
		// Playing the 3 as 14→11 leaves die 5 dead (11-5=6 ✗, 12-5=7 ✗),
		// so that move forfeits a playable die and must be rejected.
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 14 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 6 },
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 6 },
			{ id: 5, player: PlayerType.PLAYER_TWO, lane: 21 },
			{ id: 6, player: PlayerType.PLAYER_TWO, lane: 21 },
			{ id: 7, player: PlayerType.PLAYER_TWO, lane: 19 },
			{ id: 8, player: PlayerType.PLAYER_TWO, lane: 19 },
			{ id: 9, player: PlayerType.PLAYER_ONE, lane: 12 },
			{ id: 10, player: PlayerType.PLAYER_TWO, lane: 4 },
			{ id: 11, player: PlayerType.PLAYER_TWO, lane: 4 },
			{ id: 12, player: PlayerType.PLAYER_TWO, lane: 7 },
			{ id: 13, player: PlayerType.PLAYER_TWO, lane: 7 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers,
		} );

		// 14 → 11 with the 3: legal in isolation, but strands the 5.
		click( store, { id: 1, lane: 14 } );
		expect( store.getState().notice.message ).toBe(
			MessageType.MUST_PLAY_MAX_DICE
		);
		expect(
			store.getState().checkers.find( ( c: CheckerType ) => c.id === 1 )
				?.lane
		).toBe( 14 );
		expect( store.getState().dice ).toEqual( [ 3, 5 ] );

		// 12 → 9 with the 3 keeps the 5 playable (14 → 9).
		click( store, { id: 9, lane: 12 } );
		expect( store.getState().notice.message ).toBe(
			MessageType.MOVE_CHECKER
		);
		expect(
			store.getState().checkers.find( ( c: CheckerType ) => c.id === 9 )
				?.lane
		).toBe( 9 );
		expect( store.getState().dice ).toEqual( [ 5 ] );
	} );
} );

describe( 'Turn ends automatically when the remaining dice are unplayable', () => {
	it( 'passes the turn after a move leaves the other die blocked', () => {
		// P1 rolls [3, 5]; only checker on lane 8. 8-3=5 ✓, then 5-5 → not
		// bearing off (checker on 24 outside home) and 24 is fully blocked.
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 8 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 24 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 3 }, // blocks 8-5
			{ id: 4, player: PlayerType.PLAYER_TWO, lane: 3 },
			{ id: 5, player: PlayerType.PLAYER_TWO, lane: 21 }, // blocks 24-3
			{ id: 6, player: PlayerType.PLAYER_TWO, lane: 21 },
			{ id: 7, player: PlayerType.PLAYER_TWO, lane: 19 }, // blocks 24-5
			{ id: 8, player: PlayerType.PLAYER_TWO, lane: 19 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			checkers,
		} );

		click( store, { id: 1, lane: 8 } );

		const state = store.getState();
		expect(
			state.checkers.find( ( c: CheckerType ) => c.id === 1 )?.lane
		).toBe( 5 );
		expect( state.currentPlayer ).toBe( PlayerType.PLAYER_TWO );
		expect( state.dice.length ).toBeGreaterThan( 0 ); // auto-rolled for P2
	} );

	it( 'forfeits the opponent turn too if their auto-roll is unplayable', () => {
		// P2 is on the bar with P1 holding all six entry points; whatever P2
		// rolls after P1 finishes must be forfeited straight back to P1.
		const checkers = padToFifteen( [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 25 }, // P2 bar
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 1 },
			{ id: 3, player: PlayerType.PLAYER_ONE, lane: 1 },
			{ id: 4, player: PlayerType.PLAYER_ONE, lane: 2 },
			{ id: 5, player: PlayerType.PLAYER_ONE, lane: 2 },
			{ id: 6, player: PlayerType.PLAYER_ONE, lane: 3 },
			{ id: 7, player: PlayerType.PLAYER_ONE, lane: 3 },
			{ id: 8, player: PlayerType.PLAYER_ONE, lane: 4 },
			{ id: 9, player: PlayerType.PLAYER_ONE, lane: 4 },
			{ id: 10, player: PlayerType.PLAYER_ONE, lane: 5 },
			{ id: 11, player: PlayerType.PLAYER_ONE, lane: 5 },
			{ id: 12, player: PlayerType.PLAYER_ONE, lane: 6 },
			{ id: 13, player: PlayerType.PLAYER_ONE, lane: 6 },
			{ id: 14, player: PlayerType.PLAYER_ONE, lane: 8 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 2 ],
			checkers,
		} );

		// P1 plays the last die: 8 → 6.
		updateGame(
			store.dispatch,
			checkers.map( ( c ) => ( c.id === 14 ? { ...c, lane: 6 } : c ) ),
			[],
			createNotice( NoticeStatusType.SUCCESS, MessageType.MOVE_CHECKER ),
			PlayerType.PLAYER_ONE
		);

		const state = store.getState();
		expect( state.currentPlayer ).toBe( PlayerType.PLAYER_ONE );
		expect( state.notice.message ).toBe( MessageType.NO_VALID_MOVES );
		expect( state.dice.length ).toBeGreaterThan( 0 );
	} );
} );

describe( 'Game over', () => {
	it( 'does not hand the turn to the opponent after the winning move', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 1 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 25 },
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 12 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 1 ],
			checkers,
		} );

		click( store, { id: 1, lane: 1 } );

		const state = store.getState();
		expect( state.gameOver ).toBe( true );
		expect( state.currentPlayer ).toBe( PlayerType.PLAYER_ONE );
		expect( state.dice ).toEqual( [] );
		expect( state.scores[ PlayerType.PLAYER_ONE ] ).toBe( 2 ); // gammon
	} );

	it( 'multiplies win points by the cube value passed from state', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 1 },
			{ id: 2, player: PlayerType.PLAYER_TWO, lane: 0 }, // P2 borne off one
			{ id: 3, player: PlayerType.PLAYER_TWO, lane: 12 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_TWO,
			dice: [ 1 ],
			checkers,
		} );
		store.dispatch( offerDouble() );
		store.dispatch( acceptDouble() ); // cube = 2, owned by P1
		store.dispatch( toggleCurrentPlayer( PlayerType.PLAYER_TWO ) ); // P1 to move

		click( store, { id: 1, lane: 1 } );

		expect( store.getState().gameOver ).toBe( true );
		expect( store.getState().scores[ PlayerType.PLAYER_ONE ] ).toBe( 2 ); // single × 2
	} );

	it( 'rejects any further move once the game is over', () => {
		const checkers = makeCheckers( [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 12 },
		] );
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_TWO,
			dice: [ 3, 4 ],
			checkers,
			gameOver: true,
		} );

		click( store, { id: 1, lane: 12 } );

		expect( store.getState().notice.message ).toBe( MessageType.GAME_OVER );
		expect( store.getState().checkers[ 0 ].lane ).toBe( 12 );
	} );

	it( 'surrender concedes the current cube value', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			cube: { value: 4, owner: PlayerType.PLAYER_ONE, offered: false },
		} );
		store.dispatch( surrenderGame() );
		expect( store.getState().scores[ PlayerType.PLAYER_TWO ] ).toBe( 4 );
	} );
} );

describe( 'Undo boundary', () => {
	it( 'cannot undo moves from a completed turn after the hand-off', () => {
		const store = createTestStore( {
			currentPlayer: PlayerType.PLAYER_ONE,
			dice: [ 2 ],
		} );
		store.dispatch(
			moveChecker( { checkers: store.getState().checkers } )
		);
		expect( store.getState().moveHistory.length ).toBe( 1 );

		store.dispatch( toggleCurrentPlayer( PlayerType.PLAYER_ONE ) );
		expect( store.getState().moveHistory.length ).toBe( 0 );

		store.dispatch( undoMove() );
		expect( store.getState().notice.message ).toBe(
			MessageType.NO_MOVES_TO_UNDO
		);
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_TWO );
	} );
} );

describe( 'Opening roll on Start Game', () => {
	it( 'higher die starts and plays both dice', () => {
		const store = createTestStore();
		const rolls = [ 2, 6 ]; // P1 rolls 2, P2 rolls 6
		startGame( {
			dispatch: store.dispatch,
			getState: () => store.getState(),
			rollDie: () => rolls.shift() ?? 1,
		} );
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_TWO );
		expect( store.getState().dice ).toEqual( [ 6, 2 ] );
	} );

	it( 're-rolls ties until the dice differ', () => {
		const store = createTestStore();
		const rolls = [ 4, 4, 3, 3, 5, 1 ];
		startGame( {
			dispatch: store.dispatch,
			getState: () => store.getState(),
			rollDie: () => rolls.shift() ?? 1,
		} );
		expect( store.getState().currentPlayer ).toBe( PlayerType.PLAYER_ONE );
		expect( store.getState().dice ).toEqual( [ 5, 1 ] );
		expect( rolls ).toEqual( [] );
	} );
} );
