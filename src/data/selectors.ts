/**
 * Internal dependencies
 */
import { PlayerType } from '../types';

interface Checker {
	id: number;
	lane: number;
	player: PlayerType;
}

interface CheckerParams {
	checkers: Checker[];
	currentPlayer: PlayerType;
	die: number;
	lane: number;
}

interface PlayerParams {
	player: PlayerType;
	currentPlayer: PlayerType;
}

interface LaneParams {
	checkers?: Checker[];
	currentPlayer?: PlayerType;
	lane: number;
}

/**
 * Calculates and returns the target lane for a player in a game.
 *
 * @param {Object} params - The function parameters.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number | undefined} The target lane or `undefined` if the target lane cannot be determined.
 *
 * @example
 *
 * getTargetLane({ currentPlayer: PlayerType.PLAYER_ONE, die: 5, lane: 0 }); // returns 5
 * getTargetLane({ currentPlayer: PlayerType.PLAYER_TWO, die: 5, lane: 0 }); // returns 20
 *
 */
export const getTargetLane = ( {
	currentPlayer,
	die,
	lane,
}: {
	currentPlayer: PlayerType;
	die: number;
	lane: number;
} ): number => {
	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		if ( lane === 0 ) return die; // Coming from the bar

		// Handle bearing off cases
		if ( lane >= 19 && lane <= 24 && lane + die >= 25 ) return 25;

		return lane + die; // Normal movement on the board
	}

	if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		if ( lane === 25 ) return 25 - die; // Coming from the bar

		// Handle bearing off cases
		if ( lane >= 1 && lane <= 6 && lane - die <= 0 ) return 0;

		return lane - die; // Normal movement on the board
	}

	throw new Error( `Invalid player type: ${ currentPlayer }` );
};

/**
 * Retrieves the ID of the checker that is on the specified lane.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {number | undefined} params.lane - The lane to check.
 *
 * @returns {number} The ID of the checker on the specified lane, or `undefined` if no checker is found.
 *
 * @example
 *
 * getHitCheckerId({ checkers: [{id: 1, lane: 5}, {id: 2, lane: 3}], lane: 5 }); // returns 1
 * getHitCheckerId({ checkers: [{id: 1, lane: 5}, {id: 2, lane: 3}], lane: 7 }); // returns undefined
 *
 */
export const getHitCheckerId = ( {
	checkers,
	lane,
}: LaneParams ): number | undefined => {
	const checker = checkers?.find( ( checker ) => checker.lane === lane );

	return checker?.id;
};

/**
 * Calculates and returns the count of the current player's checkers on the target lane.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number} The count of the current player's checkers on the target lane. Returns 0 if the target lane is the end of the board for the current player.
 *
 * @example
 *
 * getCurrentPlayerCheckerCount({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 5, lane: 0 }); // returns count
 *
 */
const getCurrentPlayerCheckerCount = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): number => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );

	if ( currentPlayer === PlayerType.PLAYER_ONE && targetLane === 25 ) {
		return 0;
	}

	if ( currentPlayer === PlayerType.PLAYER_TWO && targetLane === 0 ) {
		return 0;
	}

	return checkers.reduce( ( acc, checker ) => {
		return checker.lane === targetLane && checker.player === currentPlayer ? acc + 1 : acc; // prettier-ignore
	}, 0 );
};

/**
 * Calculates and returns the count of the other player's checkers on the target lane.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number} The count of the other player's checkers on the target lane. Returns 0 if the target lane is the end of the board for the current player.
 *
 * @example
 *
 * getOtherPlayerCheckerCount({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 5, lane: 0 }); // returns count
 *
 */
const getOtherPlayerCheckerCount = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): number => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );

	if ( currentPlayer === PlayerType.PLAYER_ONE && targetLane === 25 ) {
		return 0;
	}

	if ( currentPlayer === PlayerType.PLAYER_TWO && targetLane === 0 ) {
		return 0;
	}

	return checkers.reduce( ( acc, checker ) => {
		return checker.lane === targetLane && checker.player !== currentPlayer ? acc + 1 : acc; // prettier-ignore
	}, 0 );
};

/**
 * Calculates and returns the count of the other player's checkers on the target lane.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number} The count of the other player's checkers on the target lane. Returns 0 if the target lane is the end of the board for the current player.
 *
 * @example
 *
 * getOtherPlayerCheckerCount({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 5, lane: 0 }); // returns count
 *
 */
export const hasDiceBeenRolled = ( dice: number[] ): boolean => {
	return dice.length > 0;
};

/**
 * Determines if the player is the current player.
 *
 * @param {Object} params - The function parameters.
 * @param {PlayerType} params.player - The player to check.
 * @param {PlayerType} params.currentPlayer - The current player.
 *
 * @returns {boolean} Returns `true` if the player is the current player, and `false` otherwise.
 *
 * @example
 *
 * isCurrentPlayer({ player: PlayerType.PLAYER_ONE, currentPlayer: PlayerType.PLAYER_ONE }); // returns true
 * isCurrentPlayer({ player: PlayerType.PLAYER_TWO, currentPlayer: PlayerType.PLAYER_ONE }); // returns false
 *
 */
export const isCurrentPlayer = ( {
	player,
	currentPlayer,
}: PlayerParams ): boolean => {
	return player === currentPlayer;
};

/**
 * Determines if the current player has a checker waiting to be played on the board.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 *
 * @returns {boolean} Returns `true` if the current player has a checker waiting (i.e., a checker on lane 0 for blue player or lane 25 for red player), and `false` otherwise.
 *
 * @example
 *
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE }); // returns true
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_TWO }); // returns false
 *
 */
export const hasWaitingChecker = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean => {
	let result = false;

	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		result = checkers.some(
			( checker ) =>
				checker.lane === 0 && checker.player === currentPlayer
		);
	} else if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		result = checkers.some(
			( checker ) =>
				checker.lane === 25 && checker.player === currentPlayer
		);
	}

	return result;
};

/**
 * Determines if the current player has a checker waiting to be played on the board.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 *
 * @returns {boolean | undefined} Returns `true` if the current player has a checker waiting (i.e., a checker on lane 0 for blue player or lane 25 for red player), and `false` otherwise. Returns `undefined` if the current player is neither `PLAYER_ONE` nor `PLAYER_TWO`.
 *
 * @example
 *
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE }); // returns true
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_TWO }); // returns false
 *
 */
export const isCheckerClearedOff = ( {
	lane,
	currentPlayer,
}: LaneParams ): boolean => {
	return currentPlayer === PlayerType.PLAYER_ONE ? lane === 25 : lane === 0;
};

/**
 * Determines if a checker is on the board.
 *
 * @param {Object} params - The function parameters.
 * @param {number} params.lane - The current lane of the checker.
 *
 * @returns {boolean} Returns `true` if the checker is on the board (i.e., if the lane is between 1 and 24 inclusive), and `false` otherwise.
 *
 * @example
 *
 * isCheckerOnTheBoard({ lane: 1 }); // returns true
 * isCheckerOnTheBoard({ lane: 24 }); // returns true
 * isCheckerOnTheBoard({ lane: 0 }); // returns false
 * isCheckerOnTheBoard({ lane: 25 }); // returns false
 *
 */
export const isCheckerOnTheBoard = ( { lane }: { lane: number } ): boolean => {
	return lane > 0 && lane < 25;
};

/**
 * Determines if the target lane is occupied by the current player's checker.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the checker.
 *
 * @returns {boolean} Returns `true` if the target lane is occupied by 5 checkers (the maximum allowed in backgammon), and `false` otherwise.
 *
 * @example
 *
 * isTargetOccupiedByCurrentPlayer({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 5, lane: 0 }); // returns true
 * isTargetOccupiedByCurrentPlayer({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 4, lane: 0 }); // returns false
 *
 */
export const isTargetOccupiedByCurrentPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );

	// If the target is the bearing off point, it's never considered occupied
	if ( targetLane === 0 || targetLane === 25 ) {
		return false;
	}

	// Count the current player's checkers on the target lane
	const currentPlayerCheckerCount = checkers.reduce( ( count, checker ) => {
		if ( checker.lane === targetLane && checker.player === currentPlayer ) {
			return count + 1;
		}
		return count;
	}, 0 );

	// A lane is considered occupied by the current player if there are 5 checkers
	// (the maximum allowed in backgammon)
	return currentPlayerCheckerCount >= 5;
};

/**
 * Determines if the target lane is occupied by the other player's checker.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {number} params.die - The current die roll.
 * @param {number} params.lane - The current lane of the checker.
 *
 * @returns {boolean} Returns `true` if the target lane is occupied by 2 or more of the other player's checkers, and `false` otherwise.
 *
 * @example
 *
 * isTargetOccupiedByOtherPlayer({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 3, lane: 0 }); // returns false
 *
 */
export const isTargetOccupiedByOtherPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );

	// If the target is the bearing off point, it's never blocked
	if ( targetLane === 0 || targetLane === 25 ) {
		return false;
	}

	// Count opponent checkers on the target lane
	const opponentCheckerCount = checkers.reduce( ( count, checker ) => {
		if ( checker.lane === targetLane && checker.player !== currentPlayer ) {
			return count + 1;
		}
		return count;
	}, 0 );

	// A lane is blocked if there are 2 or more opponent checkers
	return opponentCheckerCount >= 2;
};

/**
 * Determines if a move will hit an opponent's checker.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the checker.
 *
 * @returns {boolean} Returns `true` if the move will hit an opponent's checker (i.e., if there is exactly one opponent's checker on the target lane), and `false` otherwise.
 *
 * @example
 *
 * willHitOpponent({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 5, lane: 0 }); // returns true
 * willHitOpponent({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_ONE, die: 4, lane: 0 }); // returns false
 *
 */
export const willHitOpponent = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );

	// If the target lane is the bearing off point, no hit is possible
	if ( targetLane === 0 || targetLane === 25 ) {
		return false;
	}

	// Count opponent checkers on the target lane
	const opponentCheckerCount = checkers.reduce( ( count, checker ) => {
		if ( checker.lane === targetLane && checker.player !== currentPlayer ) {
			return count + 1;
		}
		return count;
	}, 0 );

	// A hit is possible only if there's exactly one opponent checker
	return opponentCheckerCount === 1;
};

/**
 * Determines if the current player has any checkers outside the end zone.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 *
 * @returns {boolean | undefined} Returns `true` if the current player has any checkers outside the end zone (lanes 19-24 for blue player and lanes 1-6 for red player), and `false` otherwise. Returns `undefined` if the current player is neither `PLAYER_ONE` nor `PLAYER_TWO`.
 *
 * @example
 *
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 18, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 20, player: PlayerType.PLAYER_ONE}], currentPlayer: PlayerType.PLAYER_ONE }); // returns true
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 20, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 20, player: PlayerType.PLAYER_ONE}], currentPlayer: PlayerType.PLAYER_ONE }); // returns false
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 7, player: PlayerType.PLAYER_TWO}, {id: 2, lane: 25, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_TWO }); // returns true
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 6, player: PlayerType.PLAYER_TWO}, {id: 2, lane: 25, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_TWO }); // returns false
 *
 */
export const hasCheckersOutsideHomeBoard = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean => {
	// Filter to only include the current player's checkers that are still on the board
	// (not already borne off)
	const playerCheckers = checkers.filter(
		( checker ) =>
			checker.player === currentPlayer &&
			( currentPlayer === PlayerType.PLAYER_ONE
				? checker.lane !== 25
				: checker.lane !== 0 )
	);

	// If no checkers left on board, return false (no checkers outside home board)
	if ( playerCheckers.length === 0 ) {
		return false;
	}

	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		// Check if any of Player One's checkers are outside home board (lanes 19-24)
		// or on the bar (lane 0)
		return playerCheckers.some(
			( checker ) =>
				checker.lane === 0 || ( checker.lane > 0 && checker.lane < 19 )
		);
	} else if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		// Check if any of Player Two's checkers are outside home board (lanes 1-6)
		// or on the bar (lane 25)
		return playerCheckers.some(
			( checker ) =>
				checker.lane === 25 || ( checker.lane > 6 && checker.lane < 25 )
		);
	}

	return false;
};

/**
 * Determines if a move would clear off a checker from the board.
 *
 * @param {Object} params - The function parameters.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the checker.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 *
 * @returns {boolean} Returns `true` if the move would clear off the checker (i.e., move it beyond the end of the board), and `false` otherwise.
 *
 * @example
 *
 * wouldClearOffChecker({ die: 6, lane: 20, currentPlayer: PlayerType.PLAYER_ONE }); // returns true
 * wouldClearOffChecker({ die: 6, lane: 20, currentPlayer: PlayerType.PLAYER_TWO }); // returns false
 * wouldClearOffChecker({ die: 5, lane: 20, currentPlayer: PlayerType.PLAYER_ONE }); // returns false
 *
 */
export const wouldClearOffChecker = ( {
	die,
	lane,
	currentPlayer,
}: {
	die: number;
	lane: number;
	currentPlayer: PlayerType;
} ): boolean => {
	let result = false;

	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		// PLAYER_ONE can only bear off from their home board (lanes 19-24)
		// Ensure we're only considering checkers in the home board
		if ( lane >= 19 && lane <= 24 ) {
			// Check if the move would take the checker off the board
			// For PLAYER_ONE, either exact roll or more than needed to bear off
			result = lane + die >= 25;
		}
	} else if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		// PLAYER_TWO can only bear off from their home board (lanes 1-6)
		// Ensure we're only considering checkers in the home board
		if ( lane >= 1 && lane <= 6 ) {
			// Check if the move would take the checker off the board
			// For PLAYER_TWO, either exact roll or more than needed to bear off
			result = lane - die <= 0;
		}
	}

	return result;
};

/**
 * Determines if the current player has won the game.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 *
 * @returns {boolean} Returns `true` if all of the current player's checkers are on the end of the board (lane 25 for blue player and lane 0 for red player), and `false` otherwise.
 *
 * @example
 *
 * hasPlayerWon({ checkers: [{id: 1, lane: 25, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 25, player: PlayerType.PLAYER_ONE}], currentPlayer: PlayerType.PLAYER_ONE }); // returns true
 * hasPlayerWon({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_TWO}, {id: 2, lane: 0, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_TWO }); // returns true
 * hasPlayerWon({ checkers: [{id: 1, lane: 24, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 25, player: PlayerType.PLAYER_ONE}], currentPlayer: PlayerType.PLAYER_ONE }); // returns false
 *
 */
export const hasPlayerWon = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean => {
	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		return checkers
			.filter( ( checker ) => checker.player === PlayerType.PLAYER_ONE )
			.every( ( checker ) => checker.lane === 25 );
	}

	if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		return checkers
			.filter( ( checker ) => checker.player === PlayerType.PLAYER_TWO )
			.every( ( checker ) => checker.lane === 0 );
	}

	return false;
};

/**
 * Calculates the pip count for a player.
 * The pip count is the total distance all checkers need to travel to be removed from the board.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.player - The player to calculate pip count for.
 *
 * @returns {number} The total pip count for the specified player.
 */
export const calculatePipCount = ( {
	checkers,
	player,
}: {
	checkers: Checker[];
	player: PlayerType;
} ): number => {
	return checkers.reduce( ( total, checker ) => {
		if ( checker.player !== player ) {
			return total;
		}

		if ( player === PlayerType.PLAYER_ONE ) {
			// For Player One, count distance from current lane to lane 25 (bearing off point)
			if ( checker.lane === 0 ) {
				// Checker on bar needs to enter and then travel to bearing off
				return total + 25;
			} else if ( checker.lane === 25 ) {
				// Checker already borne off
				return total;
			} else {
				// Regular checker on board - distance to bearing off point
				return total + ( 25 - checker.lane );
			}
		} else {
			// For Player Two, count distance from current lane to lane 0 (bearing off point)
			if ( checker.lane === 25 ) {
				// Checker on bar needs to enter and then travel to bearing off
				return total + 25;
			} else if ( checker.lane === 0 ) {
				// Checker already borne off
				return total;
			} else {
				// Regular checker on board - distance to bearing off point
				return total + checker.lane;
			}
		}
	}, 0 );
};

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
	checkers: Checker[];
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
	checkers: Checker[],
	currentPlayer: PlayerType
): boolean {
	// First check if player has waiting checkers
	const hasWaiting = hasWaitingChecker( { checkers, currentPlayer } );

	// If player has waiting checkers, they must move those first
	if ( hasWaiting ) {
		// For waiting checkers, check if entry points are available
		const entryLane =
			currentPlayer === PlayerType.PLAYER_ONE ? die : 25 - die;

		// Check if target is blocked by opponent
		return ! isTargetOccupiedByOtherPlayer( {
			checkers,
			currentPlayer,
			die,
			lane: currentPlayer === PlayerType.PLAYER_ONE ? 0 : 25,
		} );
	}

	// If no waiting checkers, check all player's checkers on the board
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
			targetLane = checker.lane + die;
			// Cannot bear off if not in home board
			if ( targetLane > 24 && checker.lane < 19 ) {
				return false;
			}
		} else {
			targetLane = checker.lane - die;
			// Cannot bear off if not in home board
			if ( targetLane < 1 && checker.lane > 6 ) {
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

		// Check if target is blocked by own pieces (5+ checkers)
		const isOccupiedBySelf = isTargetOccupiedByCurrentPlayer( {
			checkers,
			currentPlayer,
			die,
			lane: checker.lane,
		} );

		return ! isBlocked && ! isOccupiedBySelf;
	} );
}
