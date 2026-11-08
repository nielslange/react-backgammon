/**
 * Store factory. The app creates one store; tests create as many as they
 * need, each with its own middleware (for example a turn driver with a
 * seeded RNG).
 */
import {
	combineReducers,
	configureStore,
	type Middleware,
} from '@reduxjs/toolkit';
import { gameReducer } from './gameSlice';
import { sessionReducer } from './sessionSlice';
import { uiReducer } from './uiSlice';

export type NetState = null;

const netReducer = ( state: NetState = null ): NetState => state;

export const rootReducer = combineReducers( {
	game: gameReducer,
	session: sessionReducer,
	ui: uiReducer,
	net: netReducer,
} );

export type RootState = ReturnType< typeof rootReducer >;

export const makeStore = ( {
	preloadedState,
	middleware = [],
	devTools = false,
}: {
	preloadedState?: Partial< RootState >;
	middleware?: Middleware[];
	devTools?: boolean;
} = {} ) =>
	configureStore( {
		reducer: rootReducer,
		preloadedState,
		devTools,
		middleware: ( getDefault ) => getDefault().prepend( ...middleware ),
	} );

export type AppStore = ReturnType< typeof makeStore >;
export type AppDispatch = AppStore[ 'dispatch' ];
