'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeAppStore, type AppStore } from '../data/store';

/**
 * One store per browser tab, created lazily so nothing game-related runs
 * at module scope on the server.
 */
export function Providers( { children }: { children: ReactNode } ) {
	const [ store ] = useState< AppStore >( makeAppStore );

	// Dev-only hook so tools (tests, the bot) can read and drive the game
	// through the same reducers the UI uses.
	useEffect( () => {
		if ( process.env.NODE_ENV === 'development' ) {
			( window as unknown as { __backgammonStore: AppStore } ).__backgammonStore =
				store;
		}
	}, [ store ] );

	return <Provider store={ store }>{ children }</Provider>;
}
