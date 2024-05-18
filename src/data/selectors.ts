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

export const getHitCheckerId = ( {
	checkers,
	lane,
}: LaneParams ): number | undefined => {
	const checker = checkers.find( ( checker ) => checker.lane === lane );

	return checker?.id;
};

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

export const hasDiceBeenRolled = ( dice: number[] ): boolean => {
	return dice.length > 0;
};

export const isCurrentPlayer = ( {
	player,
	currentPlayer,
}: PlayerParams ): boolean => {
	return player === currentPlayer;
};

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

export const isFinishedChecker = ( lane: number ): boolean => {
	return lane === 25;
};

export const isActiveChecker = ( lane: number ): boolean => {
	return lane > 0 && lane < 25;
};

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
