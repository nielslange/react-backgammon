/**
 * What the room and move logic needs from storage. The Supabase adapter
 * implements it against Postgres; tests use an in-memory version.
 */
import type { GameState, VariantId, VariantOptions } from '../engine/types';
import type { Scores } from '../data/sessionSlice';

export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'abandoned';

export type RoomRow = {
	id: string;
	code: string;
	variant: VariantId;
	options: Partial< VariantOptions >;
	match_target: number;
	host: string;
	host_name: string;
	guest: string | null;
	guest_name: string | null;
	status: RoomStatus;
};

export type GameRow = {
	id: string;
	room_id: string;
	number: number;
	snapshot: GameState;
	version: number;
	scores: Scores;
	crawford_played: boolean;
};

export type MoveKind = 'opening' | 'roll' | 'step' | 'undo' | 'resign' | 'double' | 'accept' | 'drop';

export type MoveRow = {
	game_id: string;
	seq: number;
	/** null = the server (opening roll, rolls). */
	actor: string | null;
	kind: MoveKind;
	payload: unknown;
};

export type AppliedMove = {
	gameId: string;
	seq: number;
	actor: string | null;
	kind: MoveKind;
	payload: unknown;
	snapshot: GameState;
	scores?: Scores;
	crawfordPlayed?: boolean;
};

export interface Db {
	/** Throws ServerError CODE_TAKEN when the code exists. */
	insertRoom( row: Omit< RoomRow, 'id' | 'guest' | 'guest_name' | 'status' > ): Promise< RoomRow >;
	roomByCode( code: string ): Promise< RoomRow | null >;
	roomById( id: string ): Promise< RoomRow | null >;
	/** Atomically takes the empty guest seat; false when it is taken. */
	claimGuest( roomId: string, guest: string, guestName: string ): Promise< boolean >;
	setRoomStatus( roomId: string, status: RoomStatus ): Promise< void >;
	/** Version starts at 0. Throws STALE_VERSION when the number exists. */
	insertGame( row: Omit< GameRow, 'id' | 'version' > ): Promise< GameRow >;
	gameById( id: string ): Promise< GameRow | null >;
	latestGame( roomId: string ): Promise< GameRow | null >;
	/** Appends the move and stores the snapshot; STALE_VERSION unless seq = version + 1. */
	applyMove( move: AppliedMove ): Promise< void >;
	movesAfter( gameId: string, seq: number ): Promise< MoveRow[] >;
}
