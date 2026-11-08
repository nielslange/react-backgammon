/**
 * The application store: the engine-backed slices plus the turn driver
 * that rolls real dice. Created per browser tab by `Providers`.
 */
import { createWorkerAi } from '../ai/client';
import { createOnlineDriver } from '../net/onlineDriver';
import { createOnlineHolder, type OnlineHolder } from '../net/onlineGame';
import { defaultRng } from '../runtime/rng';
import { createTurnDriver } from '../runtime/turnDriver';
import { makeStore, type AppStore } from './createStore';

const holders = new WeakMap< AppStore, OnlineHolder >();

/** The online game of a store's tab (null offline). */
export const onlineHolderOf = ( store: AppStore ): OnlineHolder => {
	let holder = holders.get( store );
	if ( ! holder ) {
		holder = createOnlineHolder();
		holders.set( store, holder );
	}
	return holder;
};

/** Tests that build their own store and driver register the holder here. */
export const registerOnlineHolder = ( store: AppStore, holder: OnlineHolder ) => {
	holders.set( store, holder );
};

export const makeAppStore = () => {
	const holder = createOnlineHolder();
	const store = makeStore( {
		middleware: [
			createTurnDriver( {
				rng: defaultRng,
				delays: { roll: 400, aiStep: 350 },
				ai: createWorkerAi(),
			} ).middleware,
			createOnlineDriver( holder ).middleware,
		],
		devTools: process.env.NODE_ENV === 'development',
	} );
	holders.set( store, holder );
	return store;
};

export type { AppDispatch, AppStore, RootState } from './createStore';
