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
import { connectGame, type OnlineHolder } from './onlineGame';
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
					setState( { kind: 'playing', room } );
					return;
				}
				if ( room.role === 'host' ) {
					setState( { kind: 'lobby', room } );
					timer = setTimeout( refresh, deps.pollMs ?? 2000 );
				} else if ( room.status === 'waiting' ) {
					setState( { kind: 'join', room } );
				} else {
					setState( { kind: 'full', room } );
				}
			} catch ( error ) {
				if ( ! live ) return;
				const errorCode = codeOf( error );
				setState(
					errorCode === 'ROOM_NOT_FOUND'
						? { kind: 'not-found' }
						: { kind: 'error', code: errorCode }
				);
			}
		};
		void refresh();

		return () => {
			live = false;
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
