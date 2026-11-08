import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { createWorkerAi } from '../../ai/client';
import { localAi } from '../../ai/local';
import type { AiPort } from '../../ai/port';
import { makeStore } from '../../data/createStore';
import { newGame } from '../../data/gameSlice';
import { selectNotice } from '../../data/selectors';
import { configureSession } from '../../data/sessionSlice';
import { scripted } from '../../runtime/rng';
import { createTurnDriver } from '../../runtime/turnDriver';
import { MessageType } from '../../types';
import { P1, P2 } from '../engine/fixtures';

const never = () => new Promise< never >( () => {} );

const vs = ( ai: AiPort, aiTimeout = 50 ) => {
	// Opening 1 (Light) vs 6 (Dark): the computer starts with 6-1, then Light gets 5-3.
	const store = makeStore( {
		middleware: [
			createTurnDriver( {
				rng: scripted( [ 1, 6, 5, 3 ] ),
				delays: { roll: 0, aiStep: 0 },
				ai,
				aiTimeout,
			} ).middleware,
		],
	} );
	store.dispatch(
		configureSession( {
			players: {
				[ P1 ]: { kind: 'human', name: 'Niels' },
				[ P2 ]: { kind: 'ai', name: 'Computer', level: 'hard' },
			},
			matchTarget: 1,
		} )
	);
	store.dispatch(
		newGame( { variant: 'backgammon', options: { cube: false } } )
	);
	return store;
};

const handsBack = async ( store: ReturnType< typeof vs > ) => {
	// The fallback searches in-process (Hard): give it room on a busy machine.
	await waitFor(
		() => expect( store.getState().game.state.player ).toBe( P1 ),
		{ timeout: 5000 }
	);
	await waitFor(
		() => expect( store.getState().game.state.dice ).toEqual( [ 5, 3 ] ),
		{ timeout: 5000 }
	);
	const dark = store
		.getState()
		.game.state.checkers.filter( ( c ) => c.player === P2 );
	expect( dark.reduce( ( sum, c ) => sum + c.lane, 0 ) ).not.toBe(
		2 * 1 + 5 * 12 + 3 * 17 + 5 * 19
	);
};

describe( 'the computer never freezes the game', () => {
	it( 'falls back to the in-process player when the AI rejects', async () => {
		await handsBack(
			vs( {
				...localAi,
				requestTurn: () => Promise.reject( new Error( 'worker died' ) ),
			} )
		);
	} );

	it( 'falls back when the AI never answers', async () => {
		await handsBack( vs( { ...localAi, requestTurn: never } ) );
	} );

	it( 'finishes the turn with legal steps when the AI returns too few', async () => {
		await handsBack( vs( { ...localAi, requestTurn: async () => [] } ) );
	} );

	it( 'says the computer is thinking while it searches', async () => {
		const store = vs( { ...localAi, requestTurn: never }, 60000 );
		await waitFor( () =>
			expect( selectNotice( store.getState() ).message ).toBe(
				MessageType.COMPUTER_THINKING
			)
		);
	} );
} );

describe( 'the worker client', () => {
	afterEach( () => vi.unstubAllGlobals() );

	it( 'answers in-process once the worker fails', async () => {
		let created = 0;
		class BrokenWorker {
			onmessage: unknown = null;
			onerror: ( ( e: unknown ) => void ) | null = null;
			onmessageerror: unknown = null;
			constructor() {
				created++;
			}
			postMessage() {
				queueMicrotask( () => this.onerror?.( new Event( 'error' ) ) );
			}
			terminate() {}
		}
		vi.stubGlobal( 'Worker', BrokenWorker );
		const ai = createWorkerAi();
		const store = vs( localAi );
		const state = store.getState().game.state;
		await expect( ai.decideCube( state, P1, 'hard' ) ).resolves.toBe(
			'roll'
		);
		expect( created ).toBe( 1 );
		// Later questions skip the broken worker.
		await expect( ai.answerDouble( state, P1, 'hard' ) ).resolves.toBe(
			'take'
		);
	} );
} );
