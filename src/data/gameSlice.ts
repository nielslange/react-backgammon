/**
 * The `game` slice: a GameState driven entirely by the engine. A rejected
 * action leaves the state untouched and records the error code.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { EngineError, type EngineErrorCode } from '../engine/errors';
import * as game from '../engine/game';
import type {
	GameState,
	Player,
	Roll,
	Step,
	VariantId,
	VariantOptions,
} from '../engine/types';

export type GameSliceState = {
	state: GameState;
	lastError: EngineErrorCode | null;
};

// No game until `newGame`: the turn driver must not roll for nobody.
const initialState: GameSliceState = {
	state: { ...game.createGame( 'backgammon' ), phase: 'idle' },
	lastError: null,
};

/** Run an engine transition; on EngineError keep the state, record the code. */
const attempt = (
	current: GameSliceState,
	fn: () => GameState
): GameSliceState => {
	try {
		return { state: fn(), lastError: null };
	} catch ( error ) {
		if ( error instanceof EngineError ) {
			return { state: current.state, lastError: error.code };
		}
		throw error;
	}
};

export const gameSlice = createSlice( {
	name: 'game',
	initialState,
	reducers: {
		newGame: (
			s,
			{
				payload,
			}: PayloadAction< {
				variant: VariantId;
				options?: Partial< VariantOptions >;
			} >
		) => attempt( s, () => game.createGame( payload.variant, payload.options ) ),

		openingRoll: ( s, { payload }: PayloadAction< { p1: number; p2: number } > ) =>
			attempt( s, () => game.openingRoll( s.state, payload.p1, payload.p2 ) ),

		roll: ( s, { payload }: PayloadAction< { roll: Roll } > ) =>
			attempt( s, () => game.roll( s.state, payload.roll ) ),

		playStep: ( s, { payload }: PayloadAction< { step: Step } > ) =>
			attempt( s, () => game.play( s.state, payload.step ) ),

		undoStep: ( s ) => attempt( s, () => game.undoStep( s.state ) ),

		resign: ( s, { payload }: PayloadAction< { player: Player } > ) =>
			attempt( s, () => game.resign( s.state, payload.player ) ),

		offerDouble: ( s, { payload }: PayloadAction< { player: Player } > ) =>
			attempt( s, () => game.offerDouble( s.state, payload.player ) ),

		acceptDouble: ( s ) => attempt( s, () => game.acceptDouble( s.state ) ),

		dropDouble: ( s ) => attempt( s, () => game.dropDouble( s.state ) ),

		loadSnapshot: ( s, { payload }: PayloadAction< { snapshot: unknown } > ) =>
			attempt( s, () => game.restore( payload.snapshot ) ),
	},
} );

export const {
	newGame,
	openingRoll,
	roll,
	playStep,
	undoStep,
	resign,
	offerDouble,
	acceptDouble,
	dropDouble,
	loadSnapshot,
} = gameSlice.actions;

export const gameReducer = gameSlice.reducer;
