/**
 * Internal dependencies
 */
import { PlayerType } from '../types';
import {
	hasWaitingChecker,
	isTargetOccupiedByOtherPlayer,
} from '../data/selectors';

/**
 * Validates if using the current die is allowed according to backgammon rules.
 * If a player can't use both dice, they must use the larger one.
 *
 * @param {Object} params - The parameters object.
 * @param {Array} params.dice - The current dice values.
 * @param {Array} params.checkers - The current checkers on the board.
 * @param {PlayerType} params.currentPlayer - The current player.
 * @param {number} params.die - The die the player is trying to use.
 *
 * @returns {boolean} Whether the move with the current die is valid according to rules.
 */
export const validateDiceUse = ( {
	dice,
	checkers,
	currentPlayer,
	die,
}: {
	dice: number[];
	checkers: any[];
	currentPlayer: PlayerType;
	die: number;
} ): boolean => {
	// If only one die is left, it's valid to use
	if ( dice.length === 1 ) {
		return true;
	}

	// If there are two different dice values
	if ( dice.length === 2 && dice[ 0 ] !== dice[ 1 ] ) {
		const smallerDie = Math.min( ...dice );
		const largerDie = Math.max( ...dice );

		// If using the larger die, always allow it
		if ( die === largerDie ) {
			return true;
		}

		// If using the smaller die, check if both dice can be used
		// Check if the player has at least one valid move with each die
		const canUseSmaller = canUseDie( smallerDie, checkers, currentPlayer );
		const canUseLarger = canUseDie( largerDie, checkers, currentPlayer );

		// If both dice can be used, allow using either
		if ( canUseSmaller && canUseLarger ) {
			return true;
		}

		// If only the larger die can be used, force using it
		return ! canUseLarger;
	}

	// For doubles or any other dice configuration, any die is valid
	return true;
};

/**
 * Checks if a player can use a specific die value for any valid move.
 *
 * @param {number} die - The die value to check
 * @param {Array} checkers - The current checkers on the board
 * @param {PlayerType} currentPlayer - The current player
 * @returns {boolean} Whether the player can use this die for any valid move
 */
function canUseDie(
	die: number,
	checkers: any[],
	currentPlayer: PlayerType
): boolean {
	return checkers.some( ( checker ) => {
		if ( checker.player !== currentPlayer ) {
			return false;
		}

		// Skip checkers that are already borne off
		if (
			( currentPlayer === PlayerType.PLAYER_ONE &&
				checker.lane === 25 ) ||
			( currentPlayer === PlayerType.PLAYER_TWO && checker.lane === 0 )
		) {
			return false;
		}

		// Calculate the target lane for this die
		let targetLane;
		if ( currentPlayer === PlayerType.PLAYER_ONE ) {
			// If on bar, check if can enter
			if ( checker.lane === 0 ) {
				targetLane = 25 - die; // Enter opponent's home board (19-24)
			} else {
				targetLane = checker.lane - die; // Player 1 moves from 24 to 1 (decreasing)
			}
			// Cannot bear off if not in home board or would overshoot
			if ( targetLane > 24 && checker.lane < 19 && checker.lane !== 0 ) {
				return false;
			}
		} else {
			// If on bar, check if can enter
			if ( checker.lane === 25 ) {
				targetLane = die; // Enter opponent's home board (1-6)
			} else {
				targetLane = checker.lane + die; // Player 2 moves from 1 to 24 (increasing)
			}
			// Cannot bear off if not in home board or would overshoot
			if ( targetLane < 1 && checker.lane > 6 && checker.lane !== 25 ) {
				return false;
			}
		}

		// Check if target is blocked by opponent
		const isBlocked = isTargetOccupiedByOtherPlayer( {
			checkers,
			currentPlayer,
			die,
			lane: checker.lane,
		} );

		return ! isBlocked;
	} );
}
