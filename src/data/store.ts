/**
 * External dependencies
 */
import { configureStore } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { reducer } from './reducer';

export const store = configureStore( {
	reducer,
	devTools: import.meta.env.DEV,
} );

// Dev-only hook so external tools (tests, bots, the MCP server) can read
// and drive the game through the same reducer the UI uses.
if ( import.meta.env.DEV ) {
	(
		window as unknown as { __backgammonStore: typeof store }
	 ).__backgammonStore = store;
}
