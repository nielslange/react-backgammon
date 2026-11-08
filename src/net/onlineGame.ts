/**
 * Connects a tab's store to an online game: loads the server's state,
 * seats the players (this tab human, the other remote), and keeps the
 * board in step with the move log through `sync`.
 */
import { loadSnapshot } from '../data/gameSlice';
import { joinedRoom, syncedVersion } from '../data/netSlice';
import { configureSession, restoreMatch } from '../data/sessionSlice';
import type { AppStore } from '../data/createStore';
import type { Player } from '../engine/types';
import { PlayerType } from '../types/PlayerType';
import { createSync, type Sync } from './sync';
import type { Transport } from './transport';

export type OnlineGame = {
	transport: Transport;
	gameId: string;
	seat: Player;
	sync: Sync;
	/** Own moves shown already but not yet confirmed by the server. */
	pending: number;
	/** Highest version the server confirmed to this tab. */
	acked: number;
	/** Own moves go out one at a time, in order. */
	queue: Promise< void >;
	/** The version at which this tab last asked for dice. */
	rollRequested: number | null;
	stop(): void;
};

/** The online game of one tab, shared by the room page and the driver. */
export type OnlineHolder = {
	current: OnlineGame | null;
	/** Ask the room page to look for a newer game (after a rematch). */
	refresh?: () => void;
};

export const createOnlineHolder = (): OnlineHolder => ( { current: null } );

/** Lets the room page be asked to refresh; returns the way to stop. */
export const setRefresh = ( holder: OnlineHolder, refresh: () => void ) => {
	holder.refresh = refresh;
	return () => {
		if ( holder.refresh === refresh ) holder.refresh = undefined;
	};
};

export type ConnectOptions = {
	gameId: string;
	roomId: string;
	roomCode: string;
	role: 'host' | 'guest';
	hostName: string;
	guestName: string;
	matchTarget: number;
};

export const connectGame = async (
	store: AppStore,
	holder: OnlineHolder,
	transport: Transport,
	options: ConnectOptions
): Promise< () => void > => {
	holder.current?.stop();
	const seat = options.role === 'host' ? PlayerType.PLAYER_ONE : PlayerType.PLAYER_TWO;
	const loaded = await transport.loadGame( options.gameId );
	const seatOf = ( player: Player, name: string ) =>
		player === seat ? { kind: 'human' as const, name } : { kind: 'remote' as const, name };
	store.dispatch(
		configureSession( {
			players: {
				[ PlayerType.PLAYER_ONE ]: seatOf( PlayerType.PLAYER_ONE, options.hostName ),
				[ PlayerType.PLAYER_TWO ]: seatOf( PlayerType.PLAYER_TWO, options.guestName ),
			},
			matchTarget: options.matchTarget,
		} )
	);
	store.dispatch( restoreMatch( {
			scores: loaded.scores,
			gameNumber: loaded.number,
			crawfordPlayed: loaded.crawfordPlayed,
		} ) );
	store.dispatch( loadSnapshot( { snapshot: loaded.snapshot } ) );
	store.dispatch(
		joinedRoom( {
			roomCode: options.roomCode,
			roomId: options.roomId,
			gameId: options.gameId,
			role: options.role,
			seat,
			status: 'playing',
			version: loaded.version,
		} )
	);

	const game = {
		transport,
		gameId: options.gameId,
		seat,
		pending: 0,
		acked: loaded.version,
		queue: Promise.resolve(),
		rollRequested: null,
	} as unknown as OnlineGame;
	game.sync = createSync( {
		snapshot: loaded.snapshot,
		version: loaded.version,
		reload: () => transport.loadGame( options.gameId ),
		onState: ( snapshot, version ) => {
			// While own moves are on their way the board is ahead of the log.
			if ( game.pending > 0 ) return;
			store.dispatch( loadSnapshot( { snapshot } ) );
			store.dispatch( syncedVersion( version ) );
		},
	} );
	holder.current = game;
	const stopLive = await transport.subscribe( options.gameId, ( move ) => game.sync.receive( move ) );
	// Moves written between loading and subscribing.
	for ( const move of await transport.movesAfter( options.gameId, loaded.version ) ) game.sync.receive( move );
	game.stop = () => {
		stopLive();
		game.sync.close();
		if ( holder.current === game ) holder.current = null;
	};
	return game.stop;
};
