/**
 * The `session` slice: who sits where, the match target and score, and the
 * Crawford rule state.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Player } from '../engine/types';
import { PlayerType } from '../types/PlayerType';

export type AiLevel = 'easy' | 'medium' | 'hard';

export type Seat =
	| { kind: 'human'; name: string }
	| { kind: 'ai'; name: string; level: AiLevel }
	| { kind: 'remote'; name: string };

export type Scores = Record< Player, number >;

export type SessionState = {
	players: Record< Player, Seat >;
	matchTarget: number;
	scores: Scores;
	crawfordPlayed: boolean;
	gameNumber: number;
};

const zero = (): Scores => ( {
	[ PlayerType.PLAYER_ONE ]: 0,
	[ PlayerType.PLAYER_TWO ]: 0,
} );

const initialState: SessionState = {
	players: {
		[ PlayerType.PLAYER_ONE ]: { kind: 'human', name: 'Light' },
		[ PlayerType.PLAYER_TWO ]: { kind: 'human', name: 'Dark' },
	},
	matchTarget: 1,
	scores: zero(),
	crawfordPlayed: false,
	gameNumber: 1,
};

/** Either player stands at match point minus one: the next game is Crawford. */
export const isCrawfordPending = ( scores: Scores, matchTarget: number ): boolean =>
	scores[ PlayerType.PLAYER_ONE ] === matchTarget - 1 ||
	scores[ PlayerType.PLAYER_TWO ] === matchTarget - 1;

export const isMatchOver = ( scores: Scores, matchTarget: number ): boolean =>
	scores[ PlayerType.PLAYER_ONE ] >= matchTarget ||
	scores[ PlayerType.PLAYER_TWO ] >= matchTarget;

/** No doubling in the Crawford game itself. */
export const isCubeAllowed = (
	scores: Scores,
	matchTarget: number,
	crawfordPlayed: boolean
): boolean => ! isCrawfordPending( scores, matchTarget ) || crawfordPlayed;

/** Scores and Crawford state after a game: the same rule online and offline. */
export const afterGame = (
	scores: Scores,
	matchTarget: number,
	crawfordPlayed: boolean,
	winner: Player | null,
	points: number
): { scores: Scores; crawfordPlayed: boolean } => {
	const wasCrawford = isCrawfordPending( scores, matchTarget ) && ! crawfordPlayed;
	const next = { ...scores };
	if ( winner !== null ) next[ winner ] += points;
	return { scores: next, crawfordPlayed: crawfordPlayed || wasCrawford };
};

export const sessionSlice = createSlice( {
	name: 'session',
	initialState,
	reducers: {
		configureSession: (
			s,
			{
				payload,
			}: PayloadAction< { players: Record< Player, Seat >; matchTarget: number } >
		) => {
			s.players = payload.players;
			s.matchTarget = payload.matchTarget;
			s.scores = zero();
			s.crawfordPlayed = false;
			s.gameNumber = 1;
		},

		gameEnded: (
			s,
			{ payload }: PayloadAction< { winner: Player | null; points: number } >
		) => {
			const next = afterGame( s.scores, s.matchTarget, s.crawfordPlayed, payload.winner, payload.points );
			s.scores = next.scores;
			s.crawfordPlayed = next.crawfordPlayed;
		},

		/** Scores and game number of an online match, as stored on the server. */
		restoreMatch: (
			s,
			{ payload }: PayloadAction< { scores: Scores; gameNumber: number; crawfordPlayed?: boolean } >
		) => {
			s.scores = payload.scores;
			s.gameNumber = payload.gameNumber;
			if ( payload.crawfordPlayed !== undefined ) s.crawfordPlayed = payload.crawfordPlayed;
		},

		nextGame: ( s ) => {
			s.gameNumber += 1;
		},
	},
} );

export const { configureSession, gameEnded, nextGame, restoreMatch } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
