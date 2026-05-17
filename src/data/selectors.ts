/**
 * Internal dependencies
 */
import { PlayerType } from '../types';
import { validateDiceUse } from '../helpers/validateMoveHelper';

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

		// Bearing off: P1's home board is 1-6, borne-off destination is 25.
		// (Lane 0 is P1's bar, never the bear-off target.)
		if ( lane >= 1 && lane <= 6 && lane - die < 1 ) return 25;

		return lane - die; // Normal movement on the board (counterclockwise, 24→1)
	}

	if ( currentPlayer === PlayerType.PLAYER_TWO ) {
		if ( lane === 25 ) return die; // Coming from the bar

		// Bearing off: P2's home board is 19-24, borne-off destination is 0.
		// (Lane 25 is P2's bar, never the bear-off target.)
		if ( lane >= 19 && lane <= 24 && lane + die > 24 ) return 0;

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
	// Borne-off checkers (P1: lane 25, P2: lane 0) are off the board entirely
	// and must not count as "outside home board" — otherwise bearing off one
	// checker would block all subsequent bear-offs.
	return playerCheckers.some( ( checker ) => {
		if ( currentPlayer === PlayerType.PLAYER_ONE ) {
			// Borne off — not on the board
			if ( checker.lane === 25 ) {
				return false;
			}
			// Bar is always outside home board
			if ( checker.lane === 0 ) {
				return true;
			}
			// For Player 1, home board is 1-6
			return checker.lane > 6;
		}

		// currentPlayer === PlayerType.PLAYER_TWO
		// Borne off — not on the board
		if ( checker.lane === 0 ) {
			return false;
		}
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

export type WinType = 'single' | 'gammon' | 'backgammon';

/**
 * Determines the win classification from the loser's checker positions.
 *
 *  - 'single':     loser has borne off ≥1 checker.
 *  - 'gammon':     loser has borne off zero, no checker on bar or in winner's home board.
 *  - 'backgammon': loser has borne off zero AND has a checker on the bar
 *                  OR in the winner's home board.
 *
 * Winner's home board: lanes 1-6 for P1, lanes 19-24 for P2.
 * Bar: lane 0 for P1, lane 25 for P2.
 * Borne-off destination: lane 25 for P1, lane 0 for P2.
 */
export const getWinType = ( {
	checkers,
	winner,
}: {
	checkers: Checker[];
	winner: PlayerType;
} ): WinType => {
	const loser =
		winner === PlayerType.PLAYER_ONE
			? PlayerType.PLAYER_TWO
			: PlayerType.PLAYER_ONE;
	const loserCheckers = checkers.filter( ( c ) => c.player === loser );
	const borneOffLane = loser === PlayerType.PLAYER_ONE ? 25 : 0;
	const loserBornOff = loserCheckers.some( ( c ) => c.lane === borneOffLane );

	if ( loserBornOff ) return 'single';

	const winnerHomeLanes =
		winner === PlayerType.PLAYER_ONE
			? new Set( [ 1, 2, 3, 4, 5, 6 ] )
			: new Set( [ 19, 20, 21, 22, 23, 24 ] );
	const loserBarLane = loser === PlayerType.PLAYER_ONE ? 0 : 25;
	const inDangerZone = loserCheckers.some(
		( c ) => c.lane === loserBarLane || winnerHomeLanes.has( c.lane )
	);

	return inDangerZone ? 'backgammon' : 'gammon';
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

// `validateDiceUse` moved to ../helpers/validateMoveHelper to be the
// single source of truth. Re-exported here for backward compatibility.
export { validateDiceUse };

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
		// B7: respect must-use-larger-die rule. If using this die now would
		// forfeit a playable larger die, suppress it from the move list.
		if (
			! validateDiceUse( {
				dice: availableDice,
				checkers,
				currentPlayer,
				die,
			} )
		) {
			return;
		}

		const targetLane = getTargetLane( {
			die,
			lane,
			currentPlayer,
		} );

		const wouldBearOff = wouldClearOffChecker( {
			die,
			lane,
			currentPlayer,
			checkers,
		} );

		if ( wouldBearOff ) {
			if ( canBearOff ) {
				// P1's borne-off lane is 25, P2's is 0.
				availableMoves[ die ] =
					currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
			}
		} else if ( targetLane > 0 && targetLane < 25 ) {
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
