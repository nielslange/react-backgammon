import { describe, expect, it } from 'vitest';
import { makeStore } from '../../data/createStore';
import {
	newGame,
	openingRoll,
	playStep,
	resign,
	undoStep,
} from '../../data/gameSlice';
import {
	selectLegalSteps,
	selectNotice,
	selectPipCounts,
	selectSeatToAct,
} from '../../data/selectors';
import { configureSession } from '../../data/sessionSlice';
import { setHint, setPreview } from '../../data/uiSlice';
import { MessageType, NoticeStatusType } from '../../types';
import { P1, P2 } from '../engine/fixtures';

const started = () => {
	const store = makeStore();
	store.dispatch(
		configureSession( {
			players: {
				[ P1 ]: { kind: 'human', name: 'Blue' },
				[ P2 ]: { kind: 'ai', name: 'Red', level: 'easy' },
			},
			matchTarget: 1,
		} )
	);
	store.dispatch( newGame( { variant: 'backgammon' } ) );
	store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
	return store;
};

describe( 'select', () => {
	it( 'selectLegalSteps is empty outside the moving phase and memoised inside it', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		expect( selectLegalSteps( store.getState() ) ).toEqual( [] );
		store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
		const steps = selectLegalSteps( store.getState() );
		expect( steps.length ).toBeGreaterThan( 0 );
		expect( selectLegalSteps( store.getState() ) ).toBe( steps );
	} );

	it( 'selectPipCounts reads both players', () => {
		expect( selectPipCounts( started().getState() ) ).toEqual( {
			[ P1 ]: 167,
			[ P2 ]: 167,
		} );
	} );

	it( 'selectSeatToAct follows the player to act', () => {
		const store = started();
		expect( selectSeatToAct( store.getState() )?.name ).toBe( 'Blue' );
		expect( selectSeatToAct( makeStore().getState() ) ).toBeNull();
	} );

	it( 'selectNotice maps lastError to a MessageType', () => {
		const store = started();
		store.dispatch( undoStep() );
		expect( selectNotice( store.getState() ) ).toEqual( {
			message: MessageType.NO_MOVES_TO_UNDO,
			status: NoticeStatusType.ERROR,
		} );
		store.dispatch(
			playStep( { step: { checkerId: 1, from: 24, to: 10, die: 14, hit: false } } )
		);
		expect( selectNotice( store.getState() ).message ).toBe(
			MessageType.NO_MOVE_FOR_CHECKER
		);
	} );

	it( 'selectNotice shows the UI hint over the last event', () => {
		const store = started();
		store.dispatch(
			setHint( { message: MessageType.PREVIEW_MOVE, status: NoticeStatusType.INFO } )
		);
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.PREVIEW_MOVE );
	} );

	it( 'a game action clears the hint and the preview', () => {
		const store = started();
		store.dispatch( setPreview( { checkerId: 1, options: [] } ) );
		store.dispatch(
			setHint( { message: MessageType.PREVIEW_MOVE, status: NoticeStatusType.INFO } )
		);
		const step = selectLegalSteps( store.getState() )[ 0 ];
		store.dispatch( playStep( { step } ) );
		expect( store.getState().ui.preview ).toBeNull();
		expect( store.getState().ui.hint ).toBeNull();
	} );

	it( 'selectNotice announces the winner and the welcome', () => {
		const fresh = makeStore();
		expect( selectNotice( fresh.getState() ).message ).toBe( MessageType.WELCOME );
		const store = started();
		store.dispatch( resign( { player: P1 } ) );
		expect( selectNotice( store.getState() ) ).toEqual( {
			message: MessageType.PLAYER_TWO_WINS,
			status: NoticeStatusType.SUCCESS,
		} );
	} );
} );
