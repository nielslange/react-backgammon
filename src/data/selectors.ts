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

export const getTargetLane = ( {
	currentPlayer,
	die,
	lane,
}: {
	currentPlayer: PlayerType;
	die: number;
	lane: number;
} ): number | undefined => {
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

	return undefined;
};

export const getHitCheckerId = ( {
	checkers,
	lane,
}: LaneParams ): number | undefined => {
	const checker = checkers?.find( ( checker ) => checker.lane === lane );

	return checker?.id;
};

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
		return checker.lane === targetLane && checker.player === currentPlayer
			? acc + 1
			: acc;
	}, 0 );
};

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
} ): boolean | undefined => {
	if ( currentPlayer === PlayerType.PLAYER_BLUE ) {
		return checkers.some(
			( checker ) =>
				checker.lane === 0 && checker.player === currentPlayer
		);
	}

	if ( currentPlayer === PlayerType.PLAYER_RED ) {
		return checkers.some(
			( checker ) =>
				checker.lane === 25 && checker.player === currentPlayer
		);
	}
};

export const isCheckerClearedOff = ( {
	lane,
	currentPlayer,
}: LaneParams ): boolean => {
	return currentPlayer === PlayerType.PLAYER_BLUE ? lane === 25 : lane === 0;
};

export const isCheckerOnTheBoard = ( { lane }: { lane: number } ): boolean => {
	return lane > 0 && lane < 25;
};

export const isTargetOccupiedByCurrentPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return (
		getCurrentPlayerCheckerCount( {
			checkers,
			currentPlayer,
			die,
			lane,
		} ) === 5
	);
};

export const isTargetOccupiedByOtherPlayer = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	return (
		getOtherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) >=
		2
	);
};

export const willHitOpponent = ( {
	checkers,
	currentPlayer,
	die,
	lane,
}: CheckerParams ): boolean => {
	console.log( { lane } );
	return (
		getOtherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) ===
		1
	);
};

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
