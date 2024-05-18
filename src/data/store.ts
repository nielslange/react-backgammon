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
	devTools: process.env.NODE_ENV !== 'production',
} );
