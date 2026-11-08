/**
 * The `net` slice: the online room this tab plays in, or null offline.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Player } from '../engine/types';

export type RoomStatus =
	'waiting' | 'playing' | 'finished' | 'abandoned' | 'disconnected';

export type NetState = null | {
	roomCode: string;
	roomId: string;
	gameId: string | null;
	role: 'host' | 'guest';
	/** The seat this tab plays: host = Light, guest = Dark. */
	seat: Player;
	status: RoomStatus;
	opponentOnline: boolean;
	/** The last move sequence number applied locally. */
	version: number;
};

export const netSlice = createSlice( {
	name: 'net',
	initialState: null as NetState,
	reducers: {
		joinedRoom: (
			_s,
			{
				payload,
			}: PayloadAction<
				Omit< NonNullable< NetState >, 'opponentOnline' >
			>
		) => ( {
			...payload,
			opponentOnline: false,
		} ),
		roomStatus: ( s, { payload }: PayloadAction< RoomStatus > ) => {
			if ( s ) s.status = payload;
		},
		opponentPresence: ( s, { payload }: PayloadAction< boolean > ) => {
			if ( s ) s.opponentOnline = payload;
		},
		syncedVersion: ( s, { payload }: PayloadAction< number > ) => {
			if ( s ) s.version = payload;
		},
		currentGame: ( s, { payload }: PayloadAction< string > ) => {
			if ( s ) s.gameId = payload;
		},
		leftRoom: () => null,
	},
} );

export const {
	joinedRoom,
	roomStatus,
	opponentPresence,
	syncedVersion,
	currentGame,
	leftRoom,
} = netSlice.actions;
export const netReducer = netSlice.reducer;
