/**
 * The application store: the engine-backed slices plus the turn driver
 * that rolls real dice.
 */
import { defaultRng } from '../runtime/rng';
import { createTurnDriver } from '../runtime/turnDriver';
import { makeStore } from './createStore';

export const store = makeStore( {
	middleware: [
		createTurnDriver( {
			rng: defaultRng,
			delays: { roll: 400, aiStep: 350 },
		} ).middleware,
	],
	devTools: import.meta.env.DEV,
} );

// Dev-only hook so external tools (tests, bots) can read and drive the
// game through the same reducers the UI uses.
if ( import.meta.env.DEV && typeof window !== 'undefined' ) {
	( window as unknown as { __backgammonStore: typeof store } ).__backgammonStore =
		store;
}

export type { AppDispatch, RootState } from './createStore';
