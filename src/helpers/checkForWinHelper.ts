/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { setGameOver, setNotice } from '../data/actions';
import { hasPlayerWon } from '../data/selectors';
import { createNotice } from './createNoticeHelper';
import {
	CheckerType,
	MessageType,
	NoticeStatusType,
	PlayerType,
} from '../types';

/**
 * Checks if a player has won the game and updates the game state accordingly.
 *
 * @param {Dispatch} dispatch - The dispatch function to dispatch actions.
 * @param {any[]} checkers - The current state of checkers.
 * @param {PlayerType} currentPlayer - The current active player.
 */
export const checkForWin = (
	dispatch: Dispatch,
	checkers: any[],
	currentPlayer: PlayerType
): void => {
	if ( hasPlayerWon( { checkers, currentPlayer } ) ) {
		const message =
			currentPlayer === PlayerType.PLAYER_ONE
				? MessageType.PLAYER_ONE_WINS
				: MessageType.PLAYER_TWO_WINS;

		dispatch(
			setNotice( createNotice( NoticeStatusType.SUCCESS, message ) )
		);
		dispatch( setGameOver() );
	}
};
