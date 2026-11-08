/**
 * Position evaluation for Triktrak: the race, entering every checker,
 * points that block the opponent's remaining path, and blot safety.
 * "Mine minus theirs", so it is symmetric between the players.
 */
import { pipCount } from '../../engine/backgammon/pips';
import { BAR, OFF, isOnBoard, opponent } from '../../engine/constants';
import type { Checker, GameState, Player } from '../../engine/types';
import { PlayerType } from '../../types/PlayerType';
import type { Evaluator } from '../types';
import { blotRisk, counts, madePoints } from './backgammon';

const W = { pip: 1, waiting: 2, block: 3, off: 2 } as const;

/** Lanes `player` still has to pass: everything beyond their rearmost checker. */
const stillAhead = ( checkers: Checker[], player: Player ) => {
	const lanes = checkers.filter( ( c ) => c.player === player && c.lane !== OFF[ player ] ).map( ( c ) => c.lane );
	if ( player === PlayerType.PLAYER_ONE ) {
		const rear = lanes.includes( BAR[ player ] ) ? 25 : Math.max( 0, ...lanes );
		return ( lane: number ) => lane < rear;
	}
	const rear = lanes.includes( BAR[ player ] ) ? 0 : Math.min( 25, ...lanes );
	return ( lane: number ) => lane > rear;
};

const features = ( checkers: Checker[], player: Player ) => {
	const byLane = counts( checkers, player );
	const ahead = stillAhead( checkers, opponent( player ) );
	const blocking = madePoints( byLane ).filter( ( lane ) => isOnBoard( lane ) && ahead( lane ) ).length;
	return (
		W.block * blocking -
		W.waiting * ( byLane.get( BAR[ player ] ) ?? 0 ) +
		W.off * ( byLane.get( OFF[ player ] ) ?? 0 ) -
		blotRisk( checkers, player )
	);
};

export const evaluateTriktrak: Evaluator = ( state: GameState, perspective: Player ) => {
	const other = opponent( perspective );
	const { checkers } = state;
	const race = pipCount( checkers, other ) - pipCount( checkers, perspective );
	return W.pip * race + features( checkers, perspective ) - features( checkers, other );
};
