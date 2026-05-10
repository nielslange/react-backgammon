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
 * getTargetLane({ currentPlayer: PlayerType.PLAYER_TWO, die: 5, lane: 25 }); // returns 20
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
		if ( lane === 0 ) return 25 - die; // Coming from the bar

		// Handle bearing off cases (Player 1 home board is 1-6, bears off to 0)
		if ( lane >= 1 && lane <= 6 && lane - die < 1 ) return 0;

		return lane - die; // Normal movement on the board (counterclockwise, 24→1)
	}

	if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		if ( lane === 25 ) return die; // Coming from the bar

		// Handle bearing off cases (Player 2 home board is 19-24, bears off to 25)
		if ( lane >= 19 && lane <= 24 && lane + die > 24 ) return 25;

		return lane + die; // Normal movement on the board (clockwise, 1→24)
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
 * @returns {boolean | undefined} Returns `true` if the current player has any checkers outside the end zone (lanes 1-6 for Player 1 and lanes 19-24 for Player 2), and `false` otherwise. Returns `undefined` if the current player is neither `PLAYER_ONE` nor `PLAYER_TWO`.
 *
 * @example
 *
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 7, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 3, player: PlayerType.PLAYER_ONE}], currentPlayer: PlayerType.PLAYER_ONE }); // returns true
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 3, player: PlayerType.PLAYER_ONE}, {id: 2, lane: 5, player: PlayerType.PLAYER_ONE}], currentPlayer: PlayerType.PLAYER_ONE }); // returns false
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 18, player: PlayerType.PLAYER_TWO}, {id: 2, lane: 20, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_TWO }); // returns true
 * hasCheckersOutsideHomeBoard({ checkers: [{id: 1, lane: 20, player: PlayerType.PLAYER_TWO}, {id: 2, lane: 24, player: PlayerType.PLAYER_TWO}], currentPlayer: PlayerType.PLAYER_TWO }); // returns false
 *
 */
export const hasCheckersOutsideHomeBoard = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean => {
	const playerCheckers = checkers.filter(
		( checker ) => checker.player === currentPlayer
	);

	// If there are no checkers for the current player, they're all borne off
	if ( playerCheckers.length === 0 ) {
		return false;
	}

	// Check if there are any checkers outside of the home board
	// For Player 1 (moves 24→1), home board is lanes 1-6 (last 6 points before bearing off)
	// For Player 2 (moves 1→24), home board is lanes 19-24 (last 6 points before bearing off)
	return playerCheckers.some( ( checker ) => {
		if ( currentPlayer === PlayerType.PLAYER_ONE ) {
			// Bar is always outside home board
			if ( checker.lane === 0 ) {
				return true;
			}
			// For Player 1, home board is 1-6
			return checker.lane > 6;
		}

		// currentPlayer === PlayerType.PLAYER_TWO
		// Bar is always outside home board
		if ( checker.lane === 25 ) {
			return true;
		}
		// For Player 2, home board is 19-24
		return checker.lane < 19;
	} );
};

/**
 * Checks if there are any checkers on higher points than the given lane.
 * For Player 1, higher means lanes greater than the given lane (closer to 24).
 * For Player 2, higher means lanes less than the given lane (closer to 1).
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {number} params.lane - The lane to check from.
 * @param {PlayerType} params.currentPlayer - The current player.
 *
 * @returns {boolean} Returns `true` if there are checkers on higher points, `false` otherwise.
 */
const hasCheckersOnHigherPoints = ( {
	checkers,
	lane,
	currentPlayer,
}: {
	checkers: Checker[];
	lane: number;
	currentPlayer: PlayerType;
} ): boolean => {
	const playerCheckers = checkers.filter(
		( checker ) => checker.player === currentPlayer
	);

	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		// For Player 1 (moves 24→1), higher points are lanes greater than the current lane (1-6 range)
		// Higher means closer to 6 (the highest point in Player 1's home board)
		return playerCheckers.some(
			( checker ) => checker.lane > lane && checker.lane >= 1 && checker.lane <= 6
		);
	} else {
		// For Player 2 (moves 1→24), higher points are lanes greater than the current lane (19-24 range)
		// Higher means closer to 24 (the highest point in Player 2's home board)
		return playerCheckers.some(
			( checker ) => checker.lane > lane && checker.lane >= 19 && checker.lane <= 24
		);
	}
};

/**
 * Determines if a move would clear off a checker from the board.
 *
 * @param {Object} params - The function parameters.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the checker.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param {Checker[]} params.checkers - An array of checker objects (optional, needed for overshoot validation).
 *
 * @returns {boolean} Returns `true` if the move would clear off the checker (i.e., move it beyond the end of the board), and `false` otherwise.
 *
 * @example
 *
 * wouldClearOffChecker({ die: 6, lane: 6, currentPlayer: PlayerType.PLAYER_ONE, checkers: [...] }); // returns true
 * wouldClearOffChecker({ die: 6, lane: 20, currentPlayer: PlayerType.PLAYER_TWO, checkers: [...] }); // returns true
 * wouldClearOffChecker({ die: 5, lane: 3, currentPlayer: PlayerType.PLAYER_ONE, checkers: [...] }); // returns false
 *
 */
export const wouldClearOffChecker = ( {
	die,
	lane,
	currentPlayer,
	checkers = [],
}: {
	die: number;
	lane: number;
	currentPlayer: PlayerType;
	checkers?: Checker[];
} ): boolean => {
	// Checkers can only be borne off from the home board
	// For Player One (moves 24→1), home board is lanes 1-6
	// For Player Two (moves 1→24), home board is lanes 19-24
	if ( currentPlayer === PlayerType.PLAYER_ONE ) {
		// Must be on the home board to bear off
		if ( lane < 1 || lane > 6 ) {
			return false;
		}

		// Calculate target lane (Player 1 moves decreasing: lane - die)
		const targetLane = lane - die;

		// If exact (target is exactly 0, which is the bearing off point), can bear off
		if ( targetLane === 0 ) {
			return true;
		}

		// If overshooting (target < 0), check if it's allowed
		if ( targetLane < 0 ) {
			// Can only overshoot if no checkers on higher points (closer to 6)
			// e.g., from lane 2, die 5 goes to lane -3, which is overshoot
			// Only valid if no checkers on lanes 3-6
			return ! hasCheckersOnHigherPoints( {
				checkers,
				lane,
				currentPlayer,
			} );
		}

		// If target is still on board (target > 0), not bearing off
		return false;
	} else if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		// Must be on the home board to bear off
		if ( lane < 19 || lane > 24 ) {
			return false;
		}

		// Calculate target lane (Player 2 moves increasing: lane + die)
		const targetLane = lane + die;

		// If exact (target is exactly 25, which is the bearing off point), can bear off
		if ( targetLane === 25 ) {
			return true;
		}

		// If overshooting (target > 25), check if it's allowed
		if ( targetLane > 25 ) {
			// Can only overshoot if no checkers on higher points (closer to 24)
			// e.g., from lane 20, die 6 goes to lane 26, which is overshoot
			// Only valid if no checkers on lanes 21-24
			return ! hasCheckersOnHigherPoints( {
				checkers,
				lane,
				currentPlayer,
			} );
		}

		// If target is still on board (target < 25), not bearing off
		return false;
	}

	return false;
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
			// Handle bar entry
			if ( checker.lane === 0 ) {
				targetLane = 25 - die;
			} else {
				targetLane = checker.lane - die; // Player 1 moves from 24 to 1 (decreasing)
			}
			// Cannot bear off if not in home board (Player 1 home board is 1-6)
			if ( targetLane < 0 && checker.lane > 6 && checker.lane !== 0 ) {
				return false;
			}
		} else {
			// Handle bar entry
			if ( checker.lane === 25 ) {
				targetLane = die;
			} else {
				targetLane = checker.lane + die; // Player 2 moves from 1 to 24 (increasing)
			}
			// Cannot bear off if not in home board (Player 2 home board is 19-24)
			if ( targetLane > 25 && checker.lane < 19 && checker.lane !== 25 ) {
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

/**
 * Returns the lanes that a checker can move to based on the current dice and game state.
 *
 * @param params - The parameters object.
 * @param params.dice - The available dice to use for movement.
 * @param params.lane - The current lane of the checker.
 * @param params.checkers - The current state of all checkers on the board.
 * @param params.currentPlayer - The current player, which can either be `PLAYER_ONE` or `PLAYER_TWO`.
 * @param params.playedDiceIndices - The indices of dice that have already been played in the current turn.
 *
 * @returns An object mapping from die value to target lane, where each die value represents a possible move
 * and the corresponding target lane is the lane the checker would move to if that die were used.
 *
 * The function follows these rules:
 * 1. Checkers can only move in one direction: Player One moves from lane 24 to lane 1, and Player Two from lane 1 to lane 24.
 * 2. A checker can't move to a lane that already has 2 or more opponent checkers.
 * 3. If any checker is on the bar (lane 0 for Player One or lane 25 for Player Two), it must re-enter the board before any other checker can move.
 * 4. Checkers can only bear off (move off the board) if all of the player's checkers are in their home board.
 *
 * @example
 *
 * const dice = [2, 3];
 * const lane = 20;
 * const checkers = [...] // Array of Checker objects
 * const playedDiceIndices = [1]; // The die at index 1 has already been played
 * const result = getAvailableLanes({ dice, lane, checkers, currentPlayer: PlayerType.PLAYER_ONE, playedDiceIndices });
 * // result might be { 2: 18 }, meaning the checker can move to lane 18 using the die with value 2.
 */
export const getAvailableLanes = ( {
	dice,
	lane,
	checkers,
	currentPlayer,
	playedDiceIndices,
}: {
	dice: number[];
	lane: number;
	checkers: Checker[];
	currentPlayer: PlayerType;
	playedDiceIndices?: number[];
} ): { [ key: number ]: number } => {
	// Return empty object if no dice available
	if ( dice.length === 0 ) {
		return {};
	}

	// If there are checkers on the bar, player must move them first
	// Bar is lane 0 for Player One and lane 25 for Player Two
	const playerCheckersOnBar = checkers.filter(
		( checker ) =>
			checker.player === currentPlayer &&
			( ( currentPlayer === PlayerType.PLAYER_ONE &&
				checker.lane === 0 ) ||
				( currentPlayer === PlayerType.PLAYER_TWO &&
					checker.lane === 25 ) )
	);

	if (
		playerCheckersOnBar.length > 0 &&
		! (
			( currentPlayer === PlayerType.PLAYER_ONE && lane === 0 ) ||
			( currentPlayer === PlayerType.PLAYER_TWO && lane === 25 )
		)
	) {
		// If there are checkers on the bar but we're not trying to move one, return empty
		return {};
	}

	// Check if all the player's checkers are in their home board (or already borne off)
	const canBearOff = ! hasCheckersOutsideHomeBoard( {
		checkers,
		currentPlayer,
	} );

	// Filter out dice that have already been played
	const availableDice = playedDiceIndices
		? dice.filter( ( _, index ) => ! playedDiceIndices.includes( index ) )
		: dice;

	// Map available dice to target lanes
	const availableMoves: { [ key: number ]: number } = {};

	availableDice.forEach( ( die ) => {
		// Calculate target lane based on die value and current player
		const targetLane = getTargetLane( {
			die,
			lane,
			currentPlayer,
		} );

		// Determine if this move would bear off a checker
		const wouldBearOff = wouldClearOffChecker( {
			die,
			lane,
			currentPlayer,
			checkers,
		} );

		// Check if the move is valid
		if ( wouldBearOff ) {
			// Bearing off is only allowed if all checkers are in home board
			if ( canBearOff ) {
				// For Player One, bearing off means target lane would be 0
				// For Player Two, bearing off means target lane would be 25
				availableMoves[ die ] =
					currentPlayer === PlayerType.PLAYER_ONE ? 0 : 25;
			}
		} else if ( targetLane > 0 && targetLane < 25 ) {
			// Normal move (not bearing off)
			// Check if target lane is free or has fewer than 2 opponent checkers
			const opponentCheckersCount = checkers.filter(
				( checker ) =>
					checker.player !== currentPlayer &&
					checker.lane === targetLane
			).length;

			if ( opponentCheckersCount < 2 ) {
				availableMoves[ die ] = targetLane;
			}
		}
	} );

	return availableMoves;
};
