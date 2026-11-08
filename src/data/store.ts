/**
 * The application store: the engine-backed slices plus the turn driver
 * that rolls real dice. Created per browser tab by `Providers`.
 */
import { defaultRng } from '../runtime/rng';
import { createTurnDriver } from '../runtime/turnDriver';
import { makeStore } from './createStore';

export const makeAppStore = () =>
	makeStore( {
		middleware: [
			createTurnDriver( {
				rng: defaultRng,
				delays: { roll: 400, aiStep: 350 },
			} ).middleware,
		],
		devTools: process.env.NODE_ENV === 'development',
	} );

export type { AppDispatch, AppStore, RootState } from './createStore';
