/**
 * Shared utilities for integration tests.
 *
 * Tests run a real Redux store with the real reducer, then dispatch the same
 * actions a click would dispatch. Most tests construct a custom checker layout
 * by overriding the initial state — see `createTestStore`.
 */
import { configureStore } from '@reduxjs/toolkit';
import type { CheckerType, StateType } from '../../types';
import { PlayerType } from '../../types';
import { reducer } from '../../data/reducer';
import { initialState } from '../../data/state';

/**
 * Build a fresh checker array for tests. Players need to provide enough
 * detail for the scenario; missing fields default to no-op values.
 */
export const makeCheckers = (
	specs: Array< { id?: number; player: PlayerType; lane: number } >
): CheckerType[] =>
	specs.map( ( s, i ) => ( {
		id: s.id ?? i + 1,
		player: s.player,
		lane: s.lane,
	} ) );

/**
 * Pad checker list to 15 per player so pip counts and bear-off checks behave
 * correctly. Extra checkers are placed on a "safe" home-board lane.
 */
export const padToFifteen = (
	specs: Array< { id?: number; player: PlayerType; lane: number } >
): CheckerType[] => {
	const p1 = specs.filter( ( s ) => s.player === PlayerType.PLAYER_ONE );
	const p2 = specs.filter( ( s ) => s.player === PlayerType.PLAYER_TWO );
	const padP1 = Array.from( { length: 15 - p1.length }, () => ( {
		player: PlayerType.PLAYER_ONE,
		lane: 1,
	} ) );
	const padP2 = Array.from( { length: 15 - p2.length }, () => ( {
		player: PlayerType.PLAYER_TWO,
		lane: 24,
	} ) );
	return makeCheckers( [ ...specs, ...padP1, ...padP2 ] );
};

/**
 * Create a Redux store seeded with a partial state. Anything not provided
 * comes from the real `initialState`.
 */
export const createTestStore = ( overrides: Partial< StateType > = {} ) => {
	const preloaded: StateType = {
		...initialState,
		...overrides,
	};
	return configureStore( {
		reducer,
		preloadedState: preloaded,
	} );
};

export type TestStore = ReturnType< typeof createTestStore >;
