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
import { gameReducer, offerDouble } from './gameSlice';
import { MessageType } from '../types/MessageType';
import { NoticeStatusType } from '../types/NoticeStatusType';
import { sessionReducer } from './sessionSlice';
import { isCubeAllowed } from './sessionSlice';
import { setHint, uiReducer } from './uiSlice';

export type NetState = null;

const netReducer = ( state: NetState = null ): NetState => state;

export const rootReducer = combineReducers( {
	game: gameReducer,
	session: sessionReducer,
	ui: uiReducer,
	net: netReducer,
} );

export type RootState = ReturnType< typeof rootReducer >;

/**
 * Refuses a double in the Crawford game for every dispatcher (UI, bots,
 * the network). The engine alone cannot know the match score.
 */
const cubeGuard: Middleware = ( api ) => ( next ) => ( action ) => {
	if ( offerDouble.match( action ) ) {
		const { session } = api.getState() as RootState;
		if ( ! isCubeAllowed( session.scores, session.matchTarget, session.crawfordPlayed ) ) {
			return next(
				setHint( { message: MessageType.CUBE_NOT_ALLOWED, status: NoticeStatusType.ERROR } )
			);
		}
	}
	return next( action );
};

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
		middleware: ( getDefault ) => getDefault().prepend( cubeGuard, ...middleware ),
	} );

export type AppStore = ReturnType< typeof makeStore >;
export type AppDispatch = AppStore[ 'dispatch' ];
