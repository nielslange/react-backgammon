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
	checkers: Checker[];
	lane: number;
}

// Get the target lane based on the current player and die roll
export const getTargetLane = ( {
	currentPlayer,
	die,
	lane,
}: {
	currentPlayer: PlayerType;
	die: number;
	lane: number;
} ): number => {
	return currentPlayer === PlayerType.PLAYER_BLUE
		? lane + die
		: lane === 0
		? 25 - die
		: lane - die;
};

// Get the ID of the checker to be hit on the target lane
export const getHitCheckerId = ( {
	checkers,
	lane,
}: LaneParams ): number | undefined => {
	const checker = checkers.find( ( checker ) => checker.lane === lane );

	return checker?.id;
};

// Count the checkers of the current player on the target lane
const currentPlayerCheckerCount = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): number => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );
	return checkers.reduce( ( acc, checker ) => {
		return checker.lane === targetLane && checker.player === currentPlayer
			? acc + 1
			: acc;
	}, 0 );
};

// Count the checkers of the opponent player on the target lane
const otherPlayerCheckerCount = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): number => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );
	return checkers.reduce( ( acc, checker ) => {
		return checker.lane === targetLane && checker.player !== currentPlayer
			? acc + 1
			: acc;
	}, 0 );
};

// Check if the dice have been rolled
export const hasDiceBeenRolled = ( dice: number[] ): boolean => {
	return dice.length > 0;
};

// Check if the player is the current player
export const isCurrentPlayer = ( {
	player,
	currentPlayer,
}: PlayerParams ): boolean => {
	return player === currentPlayer;
};

// Check if there are waiting checkers for the current player
export const hasWaitingChecker = ( {
	checkers,
	currentPlayer,
}: {
	checkers: Checker[];
	currentPlayer: PlayerType;
} ): boolean => {
	return checkers.some(
		( checker ) => checker.lane === 0 && checker.player === currentPlayer
	);
};

// Check if the checker is finished
export const isFinishedChecker = ( lane: number ): boolean => {
	return lane === 25;
};

// Check if the checker is active (in play)
export const isActiveChecker = ( lane: number ): boolean => {
	return lane > 0 && lane < 25;
};

// Check if the target lane is occupied by the current player's checkers
export const isTargetOccupiedByCurrentPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return (
		currentPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) ===
		5
	);
};

// Check if the target lane is occupied by the opponent's checkers
export const isTargetOccupiedByOtherPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return (
		otherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) >= 2
	);
};

// Check if the move will hit an opponent's checker
export const willHitOpponent = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return (
		otherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) === 1
	);
};
