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
	acceptDouble,
	dropDouble,
	loadSnapshot,
	newGame,
	offerDouble,
	openingRoll,
	playStep,
	roll,
} from '../data/gameSlice';
import { localAi } from '../ai/local';
import type { AiPort } from '../ai/port';
import { getEngine } from '../engine';
import { opponent } from '../engine/constants';
import { requestRoll } from '../data/intents';
import { selectAwaitsHumanRoll, selectCanDouble, selectSeatToAct } from '../data/selectors';
import { gameEnded } from '../data/sessionSlice';
import { setHint } from '../data/uiSlice';
import { MessageType } from '../types/MessageType';
import { NoticeStatusType } from '../types/NoticeStatusType';
import { PlayerType } from '../types/PlayerType';
import { rollDice, rollDie, type Rng } from './rng';

export type DriverOptions = {
	rng: Rng;
	delays: { roll: number; aiStep: number };
	/** The computer player; without it, AI seats are not driven. */
	ai?: AiPort;
	/** After this many ms without an answer, the in-process player answers. */
	aiTimeout?: number;
};

export type TurnDriver = ListenerMiddlewareInstance< RootState, AppDispatch >;

const hasRemoteSeat = ( root: RootState ): boolean =>
	root.session.players[ PlayerType.PLAYER_ONE ].kind === 'remote' ||
	root.session.players[ PlayerType.PLAYER_TWO ].kind === 'remote';

export const startTurnDriver = (
	listener: TurnDriver,
	{ rng, delays, ai, aiTimeout = 15000 }: DriverOptions
): void => {
	/**
	 * Asks the computer; if it fails or does not answer in time (say the
	 * worker chunk failed to load), the in-process player answers instead.
	 */
	const consult = < T >( call: ( port: AiPort ) => Promise< T > ): Promise< T > => {
		if ( ! ai || ai === localAi ) return call( localAi );
		let timer: ReturnType< typeof setTimeout > | undefined;
		const timeout = new Promise< never >( ( _resolve, reject ) => {
			timer = setTimeout( () => reject( new Error( 'The computer did not answer.' ) ), aiTimeout );
		} );
		return Promise.race( [ call( ai ), timeout ] )
			.catch( () => call( localAi ) )
			.finally( () => clearTimeout( timer ) );
	};

	// Seeds for the computer come from a counter, so the dice stay untouched.
	let aiCalls = 0;
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
		// Keep explaining why this roll happened (a forfeited turn, a bonus
		// roll, the final turn) until the next move, unless this roll is
		// itself forfeited, which shows its own notice.
		const after = api.getState().game.state;
		const why: Partial< Record< NonNullable< typeof before.lastEvent >, MessageType > > = {
			forfeit: MessageType.OPPONENT_FORFEITED,
			reroll: MessageType.BONUS_ROLL,
			'final-turn': MessageType.FINAL_TURN,
		};
		const message = before.lastEvent ? why[ before.lastEvent ] : undefined;
		if ( message && after.lastEvent !== 'forfeit' ) {
			api.dispatch( setHint( { message, status: NoticeStatusType.INFO } ) );
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
			// Online games get their dice from the server (see onlineDriver).
			if ( root.net !== null ) return;
			if ( ! seat || seat.kind === 'remote' || before.cube.offered ) return;
			if ( selectAwaitsHumanRoll( root ) ) return;
			// The computer may double before it rolls.
			if ( seat.kind === 'ai' && ai && before.player && selectCanDouble( root ) ) {
				const choice = await api.pause( consult( ( port ) => port.decideCube( before, before.player!, seat.level ) ) );
				if ( api.getState().game.state !== before ) return;
				if ( choice === 'double' ) {
					api.dispatch( offerDouble( { player: before.player } ) );
					return;
				}
			}
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
			if ( root.net !== null || ! seat || seat.kind === 'remote' ) return;
			doRoll( api, game );
		},
	} );

	// The computer plays its turn: one search, then the steps one by one.
	listener.startListening( {
		predicate: ( _action, current, previous ) => {
			const game = current.game.state;
			return (
				game.phase === 'moving' &&
				game.turnSteps.length === 0 &&
				game !== previous.game.state &&
				selectSeatToAct( current )?.kind === 'ai'
			);
		},
		effect: async ( _action, api ) => {
			if ( ! ai ) return;
			api.cancelActiveListeners();
			const start = api.getState();
			const seat = selectSeatToAct( start );
			if ( seat?.kind !== 'ai' ) return;
			const mover = start.game.state.player;
			api.dispatch( setHint( { message: MessageType.COMPUTER_THINKING, status: NoticeStatusType.INFO } ) );
			const seed = ++aiCalls;
			const turn = await api.pause(
				consult( ( port ) => port.requestTurn( start.game.state, seat.level, seed ) )
			);
			const stillMoving = () => {
				const game = api.getState().game.state;
				return game.phase === 'moving' && game.player === mover;
			};
			for ( const step of turn ) {
				await api.delay( delays.aiStep );
				if ( ! stillMoving() ) return;
				api.dispatch( playStep( { step } ) );
				if ( api.getState().game.lastError ) break;
			}
			// Robust by construction: if the answer fell short or a step was
			// refused, finish the turn with legal steps so the game never stalls.
			for ( let guard = 0; guard < 16 && stillMoving(); guard++ ) {
				const game = api.getState().game.state;
				const [ step ] = getEngine( game.variant ).legalSteps( game );
				if ( ! step ) return;
				await api.delay( delays.aiStep );
				if ( ! stillMoving() ) return;
				api.dispatch( playStep( { step } ) );
			}
		},
	} );

	// The computer answers a double offered to it.
	listener.startListening( {
		predicate: ( _action, current, previous ) =>
			current.game.state.cube.offered && ! previous.game.state.cube.offered,
		effect: async ( _action, api ) => {
			const root = api.getState();
			const game = root.game.state;
			if ( ! ai || game.player === null ) return;
			const taker = opponent( game.player );
			const seat = root.session.players[ taker ];
			if ( seat.kind !== 'ai' ) return;
			const answer = await api.pause( consult( ( port ) => port.answerDouble( game, taker, seat.level ) ) );
			if ( ! api.getState().game.state.cube.offered ) return;
			api.dispatch( answer === 'take' ? acceptDouble() : dropDouble() );
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
