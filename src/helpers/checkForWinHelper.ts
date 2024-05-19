/**
 * Internal dependencies
 */
import { setNotice, setGameOver } from '../data/actions';
import { hasPlayerWon } from '../data/selectors';
import { createNotice } from '../helpers';
import { NoticeStatusType, MessageType, PlayerType } from '../types';

export const checkForWin = (
	dispatch: any,
	checkers: Chec,
	currentPlayer: PlayerType
) => {
	if ( hasPlayerWon( { checkers, currentPlayer } ) ) {
		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			currentPlayer === PlayerType.PLAYER_BLUE
				? MessageType.PLAYER_BLUE_WINS
				: MessageType.PLAYER_RED_WINS
		);
		dispatch( setNotice( notice ) );
		dispatch( setGameOver() );
	}
};
