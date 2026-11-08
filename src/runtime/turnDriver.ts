/**
 * The turn driver: the only place that produces dice or asks the AI. A
 * Redux Toolkit listener middleware that reacts to game-state changes.
 */
import {
	createListenerMiddleware,
	isAnyOf,
	type ListenerMiddlewareInstance,
} from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../data/createStore';
import {
	loadSnapshot,
	newGame,
	openingRoll,
	roll,
} from '../data/gameSlice';
import { selectSeatToAct } from '../data/select';
import { gameEnded } from '../data/sessionSlice';
import { PlayerType } from '../types/PlayerType';
import { rollDice, rollDie, type Rng } from './rng';

export type DriverOptions = {
	rng: Rng;
	delays: { roll: number; aiStep: number };
};

export type TurnDriver = ListenerMiddlewareInstance< RootState, AppDispatch >;

const hasRemoteSeat = ( root: RootState ): boolean =>
	root.session.players[ PlayerType.PLAYER_ONE ].kind === 'remote' ||
	root.session.players[ PlayerType.PLAYER_TWO ].kind === 'remote';

export const startTurnDriver = (
	listener: TurnDriver,
	{ rng, delays }: DriverOptions
): void => {
	// Opening roll: both players roll one die; a tie re-runs this listener
	// because openingRoll is itself one of the matched actions.
	listener.startListening( {
		matcher: isAnyOf( newGame, openingRoll, loadSnapshot ),
		effect: ( _action, api ) => {
			const root = api.getState();
			if ( root.game.state.phase !== 'opening' || hasRemoteSeat( root ) ) {
				return;
			}
			api.dispatch( openingRoll( { p1: rollDie( rng ), p2: rollDie( rng ) } ) );
		},
	} );

	// Auto-roll for a local seat after a short pause.
	listener.startListening( {
		predicate: ( _action, current, previous ) =>
			current.game.state.phase === 'awaiting-roll' &&
			current.game.state !== previous.game.state,
		effect: async ( _action, api ) => {
			api.cancelActiveListeners();
			const before = api.getState().game.state;
			const seat = selectSeatToAct( api.getState() );
			if ( ! seat || seat.kind === 'remote' || before.cube.offered ) return;
			await api.delay( delays.roll );
			if ( api.getState().game.state !== before ) return;
			api.dispatch( roll( { roll: rollDice( rng ) } ) );
		},
	} );

	// Report a finished game to the session once.
	listener.startListening( {
		predicate: ( _action, current, previous ) =>
			current.game.state.phase === 'over' &&
			previous.game.state.phase !== 'over',
		effect: ( _action, api ) => {
			const result = api.getState().game.state.result;
			if ( ! result ) return;
			api.dispatch( gameEnded( { winner: result.winner, points: result.points } ) );
		},
	} );
};

export const createTurnDriver = ( options: DriverOptions ): TurnDriver => {
	const listener = createListenerMiddleware< RootState, AppDispatch >();
	startTurnDriver( listener, options );
	return listener;
};
