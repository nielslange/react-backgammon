import type { GameState, Player } from '../engine/types';

/** Higher is better for `perspective`; roughly in pips. */
export type Evaluator = ( state: GameState, perspective: Player ) => number;

export type Level = 'easy' | 'medium' | 'hard';

export type LevelConfig = {
	/** 0 = random legal turn, 1 = best by evaluation, 2 = look at the replies. */
	ply: 0 | 1 | 2;
	/** Medium: with probability `noise`, pick among the best `topK` instead of the best. */
	topK?: number;
	noise?: number;
	/** Hard: how many one-ply candidates get the expensive two-ply look. */
	topN?: number;
};
