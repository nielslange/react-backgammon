/**
 * Match-play helpers. Encapsulates score accumulation, match-end detection,
 * and the Crawford rule (no doubling in the game after either player reaches
 * match-point-minus-one).
 */
import { PlayerType } from '../types';

export type MatchScores = {
	[ PlayerType.PLAYER_ONE ]: number;
	[ PlayerType.PLAYER_TWO ]: number;
};

/**
 * Has either player reached match-point-minus-one? If so, the NEXT game must
 * be a Crawford game (no cube allowed).
 */
export const isCrawfordPending = (
	scores: MatchScores,
	matchTarget: number
): boolean => {
	const limit = matchTarget - 1;
	return (
		scores[ PlayerType.PLAYER_ONE ] === limit ||
		scores[ PlayerType.PLAYER_TWO ] === limit
	);
};

/**
 * Has the match been won?
 */
export const isMatchOver = (
	scores: MatchScores,
	matchTarget: number
): boolean =>
	scores[ PlayerType.PLAYER_ONE ] >= matchTarget ||
	scores[ PlayerType.PLAYER_TWO ] >= matchTarget;

/**
 * Determine whether the doubling cube is allowed in the current game.
 *
 * Disallowed when:
 *  - Either player is at match-point-minus-one AND the Crawford game has not
 *    yet been played (this is THE Crawford game).
 */
export const isCubeAllowed = (
	scores: MatchScores,
	matchTarget: number,
	crawfordPlayed: boolean
): boolean => {
	if ( ! isCrawfordPending( scores, matchTarget ) ) return true;
	return crawfordPlayed;
};
