interface CheckerType {
	checkers: any;
	currentPlayer: any;
	die: number;
	lane: number;
}

export const getTargetLane = ( { currentPlayer, die, lane }: { currentPlayer: string; die: number; lane: number } ) => {
	return currentPlayer === 'PLAYER_BLUE' ? lane + die : lane - die;
};

const currentPlayerCheckerCount = ( { checkers, currentPlayer, die, lane }: CheckerType ) => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );
	const count = checkers.reduce( ( acc: number, checker: any ) => {
		return checker.lane === targetLane && checker.player === currentPlayer ? acc + 1 : acc;
	}, 0 );

	return count;
};

const otherPlayerCheckerCount = ( { checkers, currentPlayer, die, lane }: CheckerType ) => {
	const targetLane = getTargetLane( { currentPlayer, lane, die } );
	const count = checkers.reduce( ( acc: number, checker: any ) => {
		return checker.lane === targetLane && checker.player !== currentPlayer ? acc + 1 : acc;
	}, 0 );

	return count;
};

export const hasDiceBeenRolled = ( dice: number[] ) => {
	return dice.length;
};

export const isCurrentPlayer = ( { player, currentPlayer }: { player: string; currentPlayer: string } ) => {
	return player === currentPlayer;
};

export const hasWaitingChecker = ( { checkers, currentPlayer }: { checkers: any; currentPlayer: string } ) => {
	return checkers.some( ( checker: any ) => checker.lane === 0 && checker.player === currentPlayer );
};

export const isFinishedChecker = ( lane: number ) => {
	return lane === 25;
};

export const isActiveChecker = ( lane: number ) => {
	return lane > 0 && lane < 25;
};

export const isTargetOccupiedByCurrentPlayer = ( { checkers, currentPlayer, die, lane }: CheckerType ) => {
	return currentPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) === 5;
};

export const isTargetOccupiedByOtherPlayer = ( { checkers, currentPlayer, die, lane }: CheckerType ) => {
	return otherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) >= 2;
};

export const willHitOpponent = ( { checkers, currentPlayer, die, lane }: CheckerType ) => {
	return otherPlayerCheckerCount( { checkers, currentPlayer, die, lane } ) === 1;
};
