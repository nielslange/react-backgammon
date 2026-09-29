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
