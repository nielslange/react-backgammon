/**
 * The `ui` slice: input mode, die selection, move preview, a transient
 * hint, and the theme. Any game action clears the preview and the hint.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Step } from '../engine/types';
import type { NoticeType } from '../types/NoticeType';
import { gameSlice } from './gameSlice';

export type GameMode = 'beginner' | 'advanced';
export type Theme = 'light' | 'dark' | 'system';

export type MovePreview = { checkerId: number; options: Step[] };

export type UiState = {
	mode: GameMode;
	selectedDie: number | null;
	preview: MovePreview | null;
	hint: NoticeType | null;
	theme: Theme;
};

const initialState: UiState = {
	mode: 'beginner',
	selectedDie: null,
	preview: null,
	hint: null,
	theme: 'system',
};

export const uiSlice = createSlice( {
	name: 'ui',
	initialState,
	reducers: {
		setMode: ( s, { payload }: PayloadAction< GameMode > ) => {
			s.mode = payload;
			s.selectedDie = null;
			s.preview = null;
		},
		selectDie: ( s, { payload }: PayloadAction< number | null > ) => {
			s.selectedDie = payload;
			s.preview = null;
		},
		setPreview: ( s, { payload }: PayloadAction< MovePreview | null > ) => {
			s.preview = payload;
		},
		setHint: ( s, { payload }: PayloadAction< NoticeType | null > ) => {
			s.hint = payload;
		},
		setTheme: ( s, { payload }: PayloadAction< Theme > ) => {
			s.theme = payload;
		},
	},
	extraReducers: ( builder ) => {
		for ( const action of Object.values( gameSlice.actions ) ) {
			builder.addCase( action, ( s ) => {
				s.preview = null;
				s.hint = null;
				s.selectedDie = null;
			} );
		}
	},
} );

export const { setMode, selectDie, setPreview, setHint, setTheme } =
	uiSlice.actions;
export const uiReducer = uiSlice.reducer;
