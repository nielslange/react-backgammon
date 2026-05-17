// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { handleClick } from '../../helpers/handleClickHelper';
import { MessageType, PlayerType } from '../../types';
import type { CheckerType } from '../../types';

// Light mock for the click event — handleClick reads
// `event.target.closest('.lane').dataset.lane`.
const eventForLane = ( lane: number ) => ( {
	target: {
		closest: vi.fn().mockReturnValue( {
			dataset: { lane: String( lane ) },
		} ),
	},
} );

type Params = {
	id: number;
	player: PlayerType;
	dice: number[];
	currentPlayer: PlayerType;
	checkers: CheckerType[];
	die: number;
	dispatch: ( a: any ) => void;
};

const setup = ( overrides: Partial< Params > = {} ): {
	params: Params;
	dispatched: any[];
} => {
	const dispatched: any[] = [];
	const dispatch = ( a: any ) => {
		dispatched.push( a );
		return a;
	};
	return {
		dispatched,
		params: {
			id: 1,
			player: PlayerType.PLAYER_ONE,
			dice: [ 3, 5 ],
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers: [],
			die: 3,
			dispatch,
			...overrides,
		},
	};
};

describe( 'handleClick — bar precedence', () => {
	it( 'rejects moving a non-bar checker while a checker is on the bar', () => {
		const checkers: CheckerType[] = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 }, // bar
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 5 },
		];
		const { params, dispatched } = setup( {
			id: 2,
			checkers,
			dice: [ 3 ],
			die: 3,
		} );

		handleClick( eventForLane( 5 ), params );

		const notice = dispatched.find( ( a ) => a.type === 'SET_NOTICE' );
		expect( notice ).toBeDefined();
		expect( notice.notice.message ).toBe( MessageType.WAITING_CHECKER );
	} );

	it( 'allows moving the bar checker itself when it can re-enter', () => {
		const checkers: CheckerType[] = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 0 },
		];
		const { params, dispatched } = setup( {
			id: 1,
			checkers,
			dice: [ 3 ],
			die: 3,
		} );

		handleClick( eventForLane( 0 ), params );

		expect(
			dispatched.some( ( a ) => a.type === 'MOVE_CHECKER' )
		).toBe( true );
	} );
} );

describe( 'handleClick — bearing off', () => {
	it( 'rejects bear-off when a checker is still outside home', () => {
		const checkers: CheckerType[] = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 6 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 13 }, // outside home
		];
		const { params, dispatched } = setup( {
			id: 1,
			checkers,
			dice: [ 6 ],
			die: 6,
		} );

		handleClick( eventForLane( 6 ), params );

		const notice = dispatched.find( ( a ) => a.type === 'SET_NOTICE' );
		expect( notice ).toBeDefined();
		expect( notice.notice.message ).toBe(
			MessageType.NOT_ALL_CHECKERS_IN_END_ZONE
		);
	} );

	it( 'allows bear-off when all checkers are in home', () => {
		const checkers: CheckerType[] = [
			{ id: 1, player: PlayerType.PLAYER_ONE, lane: 6 },
			{ id: 2, player: PlayerType.PLAYER_ONE, lane: 3 },
		];
		const { params, dispatched } = setup( {
			id: 1,
			checkers,
			dice: [ 6 ],
			die: 6,
		} );

		handleClick( eventForLane( 6 ), params );

		expect(
			dispatched.some( ( a ) => a.type === 'MOVE_CHECKER' )
		).toBe( true );
	} );
} );

describe( 'handleClick — basic guards', () => {
	it( 'rejects clicking before dice are rolled', () => {
		const { params, dispatched } = setup( { dice: [], die: 0 } );

		handleClick( eventForLane( 5 ), params );

		const notice = dispatched.find( ( a ) => a.type === 'SET_NOTICE' );
		expect( notice.notice.message ).toBe( MessageType.ROLL_DICE_FIRST );
	} );

	it( "rejects clicking the opponent's checker", () => {
		const checkers: CheckerType[] = [
			{ id: 1, player: PlayerType.PLAYER_TWO, lane: 5 },
		];
		const { params, dispatched } = setup( {
			id: 1,
			player: PlayerType.PLAYER_TWO,
			currentPlayer: PlayerType.PLAYER_ONE,
			checkers,
			dice: [ 3 ],
			die: 3,
		} );

		handleClick( eventForLane( 5 ), params );

		const notice = dispatched.find( ( a ) => a.type === 'SET_NOTICE' );
		expect( notice.notice.message ).toBe( MessageType.NOT_YOUR_CHECKER );
	} );
} );
