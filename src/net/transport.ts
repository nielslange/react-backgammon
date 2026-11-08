/**
 * How the app talks to the online backend. The rest of the app only sees
 * this interface, so the backend (Supabase today) can be swapped without
 * touching the board, the driver or the store.
 */
import type { GameState } from '../engine/types';
import type { Scores } from '../data/sessionSlice';
import type { ClientMoveKind } from '../server/moves';
import type { CreateRoomInput, JoinResult, RoomView } from '../server/rooms';
import type { LoggedMove } from './protocol';

export type ClientMove = {
	kind: ClientMoveKind;
	payload: unknown;
	version: number;
};

export type LoadedGame = {
	snapshot: GameState;
	version: number;
	number: number;
	scores: Scores;
	crawfordPlayed: boolean;
	roomId: string;
};

export type Presence = {
	/** Called with the user ids currently in the room. */
	onChange( callback: ( online: string[] ) => void ): () => void;
	leave(): void;
};

export interface Transport {
	createRoom( input: CreateRoomInput ): Promise< { code: string } >;
	joinRoom( code: string, name: string ): Promise< JoinResult >;
	/** The room as this visitor sees it (their role, its status, the current game). */
	describeRoom( code: string ): Promise< RoomView >;
	/** The next game (or a new match) after game `after` ended; the same for both players. */
	rematch( roomId: string, after: number ): Promise< { gameId: string; number: number } >;
	submit( gameId: string, move: ClientMove ): Promise< { version: number } >;
	loadGame( gameId: string ): Promise< LoadedGame >;
	movesAfter( gameId: string, seq: number ): Promise< LoggedMove[] >;
	/**
	 * Resolves once live delivery has started; call the result to stop.
	 * `onReconnect` runs whenever delivery resumes after an interruption,
	 * so the caller can fetch what it missed.
	 */
	subscribe(
		gameId: string,
		onMove: ( move: LoggedMove ) => void,
		onReconnect?: () => void
	): Promise< () => void >;
	presence( roomId: string, me: string ): Presence;
}
