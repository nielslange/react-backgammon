/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { setGameOver, setNotice } from '../data/actions';
import { getWinType, hasPlayerWon } from '../data/selectors';
import { createNotice } from './createNoticeHelper';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import type { CheckerType } from '../types';

const POINTS_BY_WIN_TYPE = {
	single: 1,
	gammon: 2,
	backgammon: 3,
} as const;

/**
 * Checks if the current player has won and dispatches the game-over update.
 * Awards 1 / 2 / 3 points for single / gammon / backgammon respectively.
 *
 * @param dispatch     Redux dispatch.
 * @param checkers     Latest checker state.
 * @param currentPlayer The player whose move just completed.
 * @param cubeValue    Optional doubling-cube multiplier (defaults to 1).
 */
export const checkForWin = (
	dispatch: Dispatch,
	checkers: CheckerType[],
	currentPlayer: PlayerType,
	cubeValue: number = 1
): void => {
	if ( ! hasPlayerWon( { checkers, currentPlayer } ) ) {
		return;
	}

	const winType = getWinType( { checkers, winner: currentPlayer } );
	const points = POINTS_BY_WIN_TYPE[ winType ] * cubeValue;
	const message =
		currentPlayer === PlayerType.PLAYER_ONE
			? MessageType.PLAYER_ONE_WINS
			: MessageType.PLAYER_TWO_WINS;

	dispatch( setNotice( createNotice( NoticeStatusType.SUCCESS, message ) ) );
	dispatch( setGameOver( currentPlayer, points ) );
};
