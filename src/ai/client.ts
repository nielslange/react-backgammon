'use client';

/**
 * AiPort backed by a Web Worker, created on first use so nothing runs during
 * server rendering. Falls back to the in-process player without Workers.
 */
import type { GameState, Player } from '../engine/types';
import { localAi } from './local';
import type { AiPort } from './port';
import type { Level } from './types';

export type WorkerRequest =
	| { id: number; kind: 'turn'; state: GameState; level: Level; seed: number }
	| { id: number; kind: 'cube' | 'answer'; state: GameState; player: Player; level: Level };

export type WorkerResponse = { id: number; result?: unknown; error?: string };

/** Omit applied to each member of a union separately. */
type RequestBody = WorkerRequest extends infer R ? ( R extends unknown ? Omit< R, 'id' > : never ) : never;

export const createWorkerAi = (): AiPort => {
	if ( typeof Worker === 'undefined' ) return localAi;
	let worker: Worker | null = null;
	let nextId = 1;
	const pending = new Map< number, { resolve: ( v: unknown ) => void; reject: ( e: Error ) => void } >();

	const ask = < T >( request: RequestBody ): Promise< T > => {
		if ( ! worker ) {
			worker = new Worker( new URL( './worker.ts', import.meta.url ), { type: 'module' } );
			worker.onmessage = ( { data }: MessageEvent< WorkerResponse > ) => {
				const entry = pending.get( data.id );
				if ( ! entry ) return;
				pending.delete( data.id );
				if ( data.error ) entry.reject( new Error( data.error ) );
				else entry.resolve( data.result );
			};
		}
		const id = nextId++;
		return new Promise< T >( ( resolve, reject ) => {
			pending.set( id, { resolve: resolve as ( v: unknown ) => void, reject } );
			worker!.postMessage( { ...request, id } );
		} );
	};

	return {
		requestTurn: ( state, level, seed ) => ask( { kind: 'turn', state, level, seed } ),
		decideCube: ( state, player, level ) => ask( { kind: 'cube', state, player, level } ),
		answerDouble: ( state, player, level ) => ask( { kind: 'answer', state, player, level } ),
	};
};
