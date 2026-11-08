/**
 * The online half of the turn driver. Own moves show at once and are sent
 * to the server one by one; a refused move puts the server's state back.
 * Dice always come from the server: this tab asks for them when its
 * player is to roll (by hand when they could double first).
 */
import { createListenerMiddleware, isAnyOf, type Action } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../data/createStore';
import { acceptDouble, dropDouble, offerDouble, playStep, resign, undoStep } from '../data/gameSlice';
import { requestRoll } from '../data/intents';
import { syncedVersion } from '../data/netSlice';
import { selectAwaitsHumanRoll } from '../data/selectors';
import { setHint } from '../data/uiSlice';
import type { ClientMoveKind } from '../server/moves';
import { MessageType } from '../types/MessageType';
import { NoticeStatusType } from '../types/NoticeStatusType';
import type { OnlineGame, OnlineHolder } from './onlineGame';

type Api = { dispatch: AppDispatch; getState: () => RootState };

const ownMoves = isAnyOf( playStep, undoStep, offerDouble, acceptDouble, dropDouble, resign );

const kindOf = ( action: Action ): { kind: ClientMoveKind; payload: unknown } => {
	if ( playStep.match( action ) ) return { kind: 'step', payload: { step: action.payload.step } };
	if ( undoStep.match( action ) ) return { kind: 'undo', payload: {} };
	if ( offerDouble.match( action ) ) return { kind: 'double', payload: {} };
	if ( acceptDouble.match( action ) ) return { kind: 'accept', payload: {} };
	if ( dropDouble.match( action ) ) return { kind: 'drop', payload: {} };
	return { kind: 'resign', payload: {} };
};

export const createOnlineDriver = ( holder: OnlineHolder, { rollDelay = 300 }: { rollDelay?: number } = {} ) => {
	const listener = createListenerMiddleware< RootState, AppDispatch >();

	const send = ( api: Api, game: OnlineGame, kind: ClientMoveKind, payload: unknown, optimistic: boolean ) => {
		if ( optimistic ) game.pending++;
		game.queue = game.queue.then( async () => {
			if ( holder.current !== game ) return;
			const version = Math.max( game.acked, game.sync.current().version );
			try {
				const result = await game.transport.submit( game.gameId, { kind, payload, version } );
				game.acked = Math.max( game.acked, result.version );
				if ( optimistic ) game.pending = Math.max( 0, game.pending - 1 );
				if ( game.pending === 0 ) api.dispatch( syncedVersion( game.acked ) );
			} catch {
				// Refused (stale, illegal or offline): the server's state wins.
				game.pending = 0;
				game.rollRequested = null;
				await game.sync.resync();
				api.dispatch( setHint( { message: MessageType.ONLINE_REFUSED, status: NoticeStatusType.ERROR } ) );
			}
		} );
	};

	const askForDice = ( api: Api ) => {
		const game = holder.current;
		const root = api.getState();
		const state = root.game.state;
		if ( ! game || ! root.net ) return;
		if ( state.phase !== 'awaiting-roll' || state.player !== root.net.seat || state.cube.offered ) return;
		const version = Math.max( game.acked, game.sync.current().version );
		if ( game.rollRequested === version ) return;
		game.rollRequested = version;
		send( api, game, 'roll', {}, false );
	};

	// Own moves: already on the board, now to the server.
	listener.startListening( {
		matcher: ownMoves,
		effect: ( action, api ) => {
			const game = holder.current;
			const root = api.getState();
			if ( ! game || ! root.net || root.game.lastError ) return;
			if ( api.getOriginalState().game.state === root.game.state ) return;
			const { kind, payload } = kindOf( action );
			send( api, game, kind, payload, true );
		},
	} );

	// The player pressed Roll.
	listener.startListening( { actionCreator: requestRoll, effect: ( _action, api ) => askForDice( api ) } );

	// This tab's player is to roll and has no cube decision: roll for them.
	listener.startListening( {
		predicate: ( _action, current, previous ) =>
			current.net !== null &&
			current.game.state !== previous.game.state &&
			current.game.state.phase === 'awaiting-roll',
		effect: async ( _action, api ) => {
			api.cancelActiveListeners();
			if ( selectAwaitsHumanRoll( api.getState() ) ) return;
			await api.delay( rollDelay );
			askForDice( api );
		},
	} );

	return listener;
};
