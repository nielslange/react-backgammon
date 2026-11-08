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
import { requestRoll } from '../data/intents';
import { selectAwaitsHumanRoll, selectSeatToAct } from '../data/selectors';
import { gameEnded } from '../data/sessionSlice';
import { setHint } from '../data/uiSlice';
import { MessageType } from '../types/MessageType';
import { NoticeStatusType } from '../types/NoticeStatusType';
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

	/** Roll for the player to act; keep explaining a forfeited previous roll. */
	const doRoll = (
		api: { dispatch: AppDispatch; getState: () => RootState },
		before: RootState[ 'game' ][ 'state' ]
	) => {
		api.dispatch( roll( { roll: rollDice( rng ) } ) );
		// Unless this roll is itself forfeited (that shows its own notice).
		const after = api.getState().game.state;
		if ( before.lastEvent === 'forfeit' && after.lastEvent !== 'forfeit' ) {
			api.dispatch(
				setHint( {
					message: MessageType.OPPONENT_FORFEITED,
					status: NoticeStatusType.INFO,
				} )
			);
		}
	};

	// Auto-roll for a local seat after a short pause. A human who could
	// double rolls by hand (requestRoll), so the cube stays reachable.
	listener.startListening( {
		predicate: ( _action, current, previous ) =>
			current.game.state.phase === 'awaiting-roll' &&
			current.game.state !== previous.game.state,
		effect: async ( _action, api ) => {
			api.cancelActiveListeners();
			const root = api.getState();
			const before = root.game.state;
			const seat = selectSeatToAct( root );
			if ( ! seat || seat.kind === 'remote' || before.cube.offered ) return;
			if ( selectAwaitsHumanRoll( root ) ) return;
			await api.delay( delays.roll );
			if ( api.getState().game.state !== before ) return;
			doRoll( api, before );
		},
	} );

	// The player asked to roll.
	listener.startListening( {
		actionCreator: requestRoll,
		effect: ( _action, api ) => {
			const root = api.getState();
			const seat = selectSeatToAct( root );
			const game = root.game.state;
			if ( game.phase !== 'awaiting-roll' || game.cube.offered ) return;
			if ( ! seat || seat.kind === 'remote' ) return;
			doRoll( api, game );
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
