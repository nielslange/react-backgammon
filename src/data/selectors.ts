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
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number | undefined} The target lane or `undefined` if the target lane cannot be determined.
 *
 * @example
 *
 * getTargetLane({ currentPlayer: PlayerType.PLAYER_BLUE, die: 5, lane: 0 }); // returns 5
 * getTargetLane({ currentPlayer: PlayerType.PLAYER_RED, die: 5, lane: 0 }); // returns 20
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
	if ( currentPlayer === PlayerType.PLAYER_BLUE ) {
		if ( lane === 0 ) return die;
		if ( lane + die > 24 ) return 25;
		return lane + die;
	}

	if ( currentPlayer === PlayerType.PLAYER_RED ) {
		if ( lane === 0 ) return 25 - die;
		if ( lane - die < 1 ) return 0;
		return lane - die;
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
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number} The count of the current player's checkers on the target lane. Returns 0 if the target lane is the end of the board for the current player.
 *
 * @example
 *
 * getCurrentPlayerCheckerCount({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE, die: 5, lane: 0 }); // returns count
 *
 */
const getCurrentPlayerCheckerCount = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): number => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );

	if ( currentPlayer === PlayerType.PLAYER_BLUE && targetLane === 25 ) {
		return 0;
	}

	if ( currentPlayer === PlayerType.PLAYER_RED && targetLane === 0 ) {
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
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number} The count of the other player's checkers on the target lane. Returns 0 if the target lane is the end of the board for the current player.
 *
 * @example
 *
 * getOtherPlayerCheckerCount({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE, die: 5, lane: 0 }); // returns count
 *
 */
const getOtherPlayerCheckerCount = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): number => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );

	if ( currentPlayer === PlayerType.PLAYER_BLUE && targetLane === 25 ) {
		return 0;
	}

	if ( currentPlayer === PlayerType.PLAYER_RED && targetLane === 0 ) {
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
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the player.
 *
 * @returns {number} The count of the other player's checkers on the target lane. Returns 0 if the target lane is the end of the board for the current player.
 *
 * @example
 *
 * getOtherPlayerCheckerCount({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE, die: 5, lane: 0 }); // returns count
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
 * isCurrentPlayer({ player: PlayerType.PLAYER_BLUE, currentPlayer: PlayerType.PLAYER_BLUE }); // returns true
 * isCurrentPlayer({ player: PlayerType.PLAYER_RED, currentPlayer: PlayerType.PLAYER_BLUE }); // returns false
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
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 *
 * @returns {boolean | undefined} Returns `true` if the current player has a checker waiting (i.e., a checker on lane 0 for blue player or lane 25 for red player), and `false` otherwise. Returns `undefined` if the current player is neither `PLAYER_BLUE` nor `PLAYER_RED`.
 *
 * @example
 *
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE }); // returns true
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_RED }); // returns false
 *
 */
export const hasWaitingChecker = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean | undefined => {
	if ( currentPlayer === PlayerType.PLAYER_BLUE ) {
		return checkers.some( ( checker ) => checker.lane === 0 && checker.player === currentPlayer ); // prettier-ignore
	}

	if ( currentPlayer === PlayerType.PLAYER_RED ) {
		return checkers.some( ( checker ) => checker.lane === 25 && checker.player === currentPlayer ); // prettier-ignore
	}
};

/**
 * Determines if the current player has a checker waiting to be played on the board.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 *
 * @returns {boolean | undefined} Returns `true` if the current player has a checker waiting (i.e., a checker on lane 0 for blue player or lane 25 for red player), and `false` otherwise. Returns `undefined` if the current player is neither `PLAYER_BLUE` nor `PLAYER_RED`.
 *
 * @example
 *
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE }); // returns true
 * hasWaitingChecker({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_RED }); // returns false
 *
 */
export const isCheckerClearedOff = ( {
	lane,
	currentPlayer,
}: LaneParams ): boolean => {
	return currentPlayer === PlayerType.PLAYER_BLUE ? lane === 25 : lane === 0;
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
export const isTargetOccupiedByCurrentPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return ( getCurrentPlayerCheckerCount( { checkers, currentPlayer, die, lane, } ) === 5 ); // prettier-ignore
};

/**
 * Determines if the target lane is occupied by the other player's checker.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 * @param {number} params.die - The current die roll.
 * @param {number} params.lane - The current lane of the checker.
 *
 * @returns {boolean} Returns `true` if the target lane is occupied by 2 or more of the other player's checkers, and `false` otherwise.
 *
 * @example
 *
 * isTargetOccupiedByOtherPlayer({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE, die: 3, lane: 0 }); // returns false
 *
 */
export const isTargetOccupiedByOtherPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return ( getOtherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) >= 2 ); // prettier-ignore
};

/**
 * Determines if a move will hit an opponent's checker.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the checker.
 *
 * @returns {boolean} Returns `true` if the move will hit an opponent's checker (i.e., if there is exactly one opponent's checker on the target lane), and `false` otherwise.
 *
 * @example
 *
 * willHitOpponent({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE, die: 5, lane: 0 }); // returns true
 * willHitOpponent({ checkers: [{id: 1, lane: 5, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 3, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_BLUE, die: 4, lane: 0 }); // returns false
 *
 */
export const willHitOpponent = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return ( getOtherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) === 1 ); // prettier-ignore
};

/**
 * Determines if the current player has any checkers outside the end zone.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 *
 * @returns {boolean | undefined} Returns `true` if the current player has any checkers outside the end zone (lanes 19-24 for blue player and lanes 1-6 for red player), and `false` otherwise. Returns `undefined` if the current player is neither `PLAYER_BLUE` nor `PLAYER_RED`.
 *
 * @example
 *
 * hasCheckoutsOutsideEndzone({ checkers: [{id: 1, lane: 18, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 20, player: PlayerType.PLAYER_BLUE}], currentPlayer: PlayerType.PLAYER_BLUE }); // returns true
 * hasCheckoutsOutsideEndzone({ checkers: [{id: 1, lane: 20, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 20, player: PlayerType.PLAYER_BLUE}], currentPlayer: PlayerType.PLAYER_BLUE }); // returns false
 * hasCheckoutsOutsideEndzone({ checkers: [{id: 1, lane: 7, player: PlayerType.PLAYER_RED}, {id: 2, lane: 25, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_RED }); // returns true
 * hasCheckoutsOutsideEndzone({ checkers: [{id: 1, lane: 6, player: PlayerType.PLAYER_RED}, {id: 2, lane: 25, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_RED }); // returns false
 *
 */
export const hasCheckoutsOutsideEndzone = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean | undefined => {
	if ( currentPlayer === PlayerType.PLAYER_BLUE ) {
		return checkers.some(
			( checker ) =>
				checker.lane > 0 &&
				checker.lane < 19 &&
				checker.player === currentPlayer
		);
	}

	if ( currentPlayer === PlayerType.PLAYER_RED ) {
		return checkers.some(
			( checker ) =>
				checker.lane > 6 &&
				checker.lane < 25 &&
				checker.player === currentPlayer
		);
	}
};

/**
 * Determines if a move would clear off a checker from the board.
 *
 * @param {Object} params - The function parameters.
 * @param {number} params.die - The value of a die roll.
 * @param {number} params.lane - The current lane of the checker.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 *
 * @returns {boolean} Returns `true` if the move would clear off the checker (i.e., move it beyond the end of the board), and `false` otherwise.
 *
 * @example
 *
 * wouldClearOffChecker({ die: 6, lane: 20, currentPlayer: PlayerType.PLAYER_BLUE }); // returns true
 * wouldClearOffChecker({ die: 6, lane: 20, currentPlayer: PlayerType.PLAYER_RED }); // returns false
 * wouldClearOffChecker({ die: 5, lane: 20, currentPlayer: PlayerType.PLAYER_BLUE }); // returns false
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
	if ( currentPlayer === PlayerType.PLAYER_BLUE ) {
		return lane + die > 24;
	}

	if ( currentPlayer === PlayerType.PLAYER_RED ) {
		return lane - die < 1;
	}

	return false;
};

/**
 * Determines if the current player has won the game.
 *
 * @param {Object} params - The function parameters.
 * @param {Checker[]} params.checkers - An array of checker objects.
 * @param {PlayerType} params.currentPlayer - The current player, which can either be `PLAYER_BLUE` or `PLAYER_RED`.
 *
 * @returns {boolean} Returns `true` if all of the current player's checkers are on the end of the board (lane 25 for blue player and lane 0 for red player), and `false` otherwise.
 *
 * @example
 *
 * hasPlayerWon({ checkers: [{id: 1, lane: 25, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 25, player: PlayerType.PLAYER_BLUE}], currentPlayer: PlayerType.PLAYER_BLUE }); // returns true
 * hasPlayerWon({ checkers: [{id: 1, lane: 0, player: PlayerType.PLAYER_RED}, {id: 2, lane: 0, player: PlayerType.PLAYER_RED}], currentPlayer: PlayerType.PLAYER_RED }); // returns true
 * hasPlayerWon({ checkers: [{id: 1, lane: 24, player: PlayerType.PLAYER_BLUE}, {id: 2, lane: 25, player: PlayerType.PLAYER_BLUE}], currentPlayer: PlayerType.PLAYER_BLUE }); // returns false
 *
 */
export const hasPlayerWon = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean => {
	if ( currentPlayer === PlayerType.PLAYER_BLUE ) {
		return checkers
			.filter( ( checker ) => checker.player === PlayerType.PLAYER_BLUE )
			.every( ( checker ) => checker.lane === 25 );
	}

	if ( currentPlayer === PlayerType.PLAYER_RED ) {
		return checkers
			.filter( ( checker ) => checker.player === PlayerType.PLAYER_RED )
			.every( ( checker ) => checker.lane === 0 );
	}

	return false;
};
