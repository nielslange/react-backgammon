/**
 * Keeps a local copy of an online game in step with the server's move log.
 * Realtime delivers moves at least once and in any order: moves are applied
 * strictly by sequence number, duplicates are ignored, and a move that stays
 * missing (or one that does not apply) triggers one reload of the stored
 * snapshot.
 */
import type { GameState } from '../engine/types';
import { applyMove, type LoggedMove } from './protocol';

export type SyncOptions = {
	snapshot: GameState;
	version: number;
	/** The authoritative state from the server. */
	reload: () => Promise< { snapshot: GameState; version: number } >;
	/** Called after every change with the new state. */
	onState: ( snapshot: GameState, version: number ) => void;
	/** How long a gap may last before reloading. */
	graceMs?: number;
};

export type Sync = {
	receive( move: LoggedMove ): void;
	current(): { snapshot: GameState; version: number };
	close(): void;
};

export const createSync = ( {
	snapshot,
	version,
	reload,
	onState,
	graceMs = 800,
}: SyncOptions ): Sync => {
	let state = snapshot;
	let seen = version;
	let closed = false;
	let reloading = false;
	let timer: ReturnType< typeof setTimeout > | null = null;
	const waiting = new Map< number, LoggedMove >();

	const clearTimer = () => {
		if ( timer ) clearTimeout( timer );
		timer = null;
	};

	/** Applies every move that directly follows; false if one did not apply. */
	const drain = (): { changed: boolean; broken: boolean } => {
		let changed = false;
		while ( waiting.has( seen + 1 ) ) {
			const move = waiting.get( seen + 1 )!;
			waiting.delete( seen + 1 );
			try {
				state = applyMove( state, move );
			} catch {
				return { changed, broken: true };
			}
			seen = move.seq;
			changed = true;
		}
		return { changed, broken: false };
	};

	const resync = async () => {
		if ( reloading || closed ) return;
		reloading = true;
		clearTimer();
		try {
			const fresh = await reload();
			if ( closed ) return;
			if ( fresh.version >= seen ) {
				state = fresh.snapshot;
				seen = fresh.version;
			}
			for ( const seq of [ ...waiting.keys() ] )
				if ( seq <= seen ) waiting.delete( seq );
			drain();
			onState( state, seen );
		} catch {
			// Offline or failing: try again after the grace period.
		} finally {
			reloading = false;
			if ( ! closed && waiting.size > 0 ) schedule();
		}
	};

	const schedule = () => {
		if ( timer || closed ) return;
		timer = setTimeout( () => {
			timer = null;
			void resync();
		}, graceMs );
	};

	return {
		receive( move ) {
			if ( closed || move.seq <= seen || waiting.has( move.seq ) ) return;
			waiting.set( move.seq, move );
			const { changed, broken } = drain();
			if ( changed ) onState( state, seen );
			if ( broken ) {
				void resync();
				return;
			}
			if ( waiting.size > 0 ) schedule();
			else clearTimer();
		},
		current: () => ( { snapshot: state, version: seen } ),
		close() {
			closed = true;
			clearTimer();
		},
	};
};
