/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { setNotice, setGameOver } from '../data/actions';
import { hasPlayerWon } from '../data/selectors';
import { createNotice } from '../helpers';
import { NoticeStatusType, MessageType, PlayerType } from '../types';

export const checkForWin = (
	dispatch: Dispatch,
	checkers: any,
	currentPlayer: PlayerType
) => {
	if ( hasPlayerWon( { checkers, currentPlayer } ) ) {
		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			currentPlayer === PlayerType.PLAYER_ONE
				? MessageType.PLAYER_ONE_WINS
				: MessageType.PLAYER_TWO_WINS
		);
		dispatch( setNotice( notice ) );
		dispatch( setGameOver() );
	}
};
