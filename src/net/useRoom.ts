'use client';

/**
 * The life of a room page: sign in, find out who this visitor is in the
 * room, wait in the lobby or join, then connect the game and presence.
 * Everything is undone when the page goes away.
 */
import { useEffect, useState } from 'react';
import { useStore } from 'react-redux';
import type { AppStore } from '../data/createStore';
import { leftRoom, opponentPresence } from '../data/netSlice';
import type { RoomView } from '../server/rooms';
import { connectGame, setRefresh, type OnlineHolder } from './onlineGame';
import type { Transport } from './transport';

export type RoomDeps = {
	transport: Transport;
	/** Signs in anonymously if needed; resolves with the user id. */
	signIn: () => Promise< string >;
	holder: OnlineHolder;
	/** How often the host's lobby checks for the friend. */
	pollMs?: number;
};

export type RoomScreenState =
	| { kind: 'loading' }
	| { kind: 'not-found' }
	| { kind: 'error'; code: string }
	| { kind: 'lobby'; room: RoomView }
	| { kind: 'join'; room: RoomView }
	| { kind: 'full'; room: RoomView }
	| { kind: 'playing'; room: RoomView };

const codeOf = ( error: unknown ) =>
	( error as { code?: string } )?.code ?? 'SERVER_ERROR';

export const useRoom = ( code: string, deps: RoomDeps ) => {
	const store = useStore() as AppStore;
	const [ state, setState ] = useState< RoomScreenState >( {
		kind: 'loading',
	} );
	const [ attempt, setAttempt ] = useState( 0 );

	useEffect( () => {
		let live = true;
		let timer: ReturnType< typeof setTimeout > | null = null;
		let stopGame: ( () => void ) | null = null;
		let leavePresence: ( () => void ) | null = null;
		let connected: string | null = null;
		// Whether this page has shown the room (lobby or game) already.
		let seenRoom = false;

		const refresh = async () => {
			try {
				const me = await deps.signIn();
				const room = await deps.transport.describeRoom( code );
				if ( ! live ) return;
				if ( room.role && room.gameId ) {
					if ( connected !== room.gameId ) {
						connected = room.gameId;
						stopGame?.();
						const stop = await connectGame(
							store,
							deps.holder,
							deps.transport,
							{
								gameId: room.gameId,
								roomId: room.roomId,
								roomCode: room.code,
								role: room.role,
								hostName: room.hostName,
								guestName: room.guestName ?? 'Dark',
								matchTarget: room.matchTarget,
							}
						);
						if ( ! live ) return stop();
						stopGame = stop;
						if ( ! leavePresence ) {
							const presence = deps.transport.presence(
								room.roomId,
								me
							);
							presence.onChange( ( online ) =>
								store.dispatch(
									opponentPresence(
										online.some( ( id ) => id !== me )
									)
								)
							);
							leavePresence = () => presence.leave();
						}
					}
					seenRoom = true;
					setState( { kind: 'playing', room } );
					return;
				}
				if ( room.role === 'host' ) {
					seenRoom = true;
					setState( { kind: 'lobby', room } );
					timer = setTimeout( () => {
						timer = null;
						void refresh();
					}, deps.pollMs ?? 2000 );
				} else if ( room.status === 'waiting' ) {
					setState( { kind: 'join', room } );
				} else {
					setState( { kind: 'full', room } );
				}
			} catch ( error ) {
				if ( ! live ) return;
				const errorCode = codeOf( error );
				// A blip after the room was shown: keep it and try again.
				if ( seenRoom && errorCode !== 'ROOM_NOT_FOUND' ) {
					if ( ! timer ) {
						timer = setTimeout( () => {
							timer = null;
							void refresh();
						}, deps.pollMs ?? 2000 );
					}
					return;
				}
				setState(
					errorCode === 'ROOM_NOT_FOUND'
						? { kind: 'not-found' }
						: { kind: 'error', code: errorCode }
				);
			}
		};
		void refresh();
		const clearRefresh = setRefresh( deps.holder, () => void refresh() );

		// After a game ends, look for the next one the other player may start.
		const watchForRematch = () => {
			const over =
				connected !== null &&
				store.getState().game.state.phase === 'over';
			if ( over && ! timer ) {
				timer = setTimeout( () => {
					timer = null;
					void refresh().then( watchForRematch );
				}, deps.pollMs ?? 2000 );
			}
		};
		const unsubscribe = store.subscribe( watchForRematch );

		return () => {
			live = false;
			unsubscribe();
			clearRefresh();
			if ( timer ) clearTimeout( timer );
			leavePresence?.();
			stopGame?.();
			store.dispatch( leftRoom() );
		};
	}, [ code, deps, store, attempt ] );

	/** Take the free seat; on success the page reconnects as the guest. */
	const join = async ( name: string ) => {
		await deps.signIn();
		await deps.transport.joinRoom( code, name );
		setAttempt( ( n ) => n + 1 );
	};

	return { state, join, retry: () => setAttempt( ( n ) => n + 1 ) };
};
