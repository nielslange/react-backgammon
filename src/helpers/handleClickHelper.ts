/**
 * Internal dependencies
 */
import { Dispatch } from 'redux';
import { setGameOver, setNotice } from '../data/actions';
import {
	hasDiceBeenRolled,
	isCurrentPlayer,
	hasWaitingChecker,
	isCheckerClearedOff,
	isCheckerOnTheBoard,
	isTargetOccupiedByCurrentPlayer,
	isTargetOccupiedByOtherPlayer,
	willHitOpponent,
	getTargetLane,
	getHitCheckerId,
	hasCheckoutsOutsideEndzone,
	wouldClearOffChecker,
	hasPlayerWon,
} from '../data/selectors';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import { checkForWin } from './checkForWinHelper';
import { createNotice } from './createNoticeHelper';
import { updateGame } from './updateGameHelper';
import { validateDiceUse } from './validateMoveHelper';

/**
 * Handles the click event on a game board lane.
 *
 * @param event - The click event object.
 * @param id - The ID of the clicked lane.
 * @param player - The player object.
 * @param dice - The array of dice values.
 * @param currentPlayer - The current player.
 * @param checkers - The array of checkers on the board.
 * @param die - The current die value.
 * @param dispatch - The dispatch function for updating the game state.
 */
export const handleClick = (
	event: any,
	{ id, player, dice, currentPlayer, checkers, die, dispatch }: any
) => {
	const lane = parseInt( event.target.closest( '.lane' ).dataset.lane );
	const targetLane = getTargetLane( { currentPlayer, lane, die } );
	const newCheckers = JSON.parse( JSON.stringify( checkers ) );
	const newDice = [ ...dice ];
	const playerObject = { checkers, currentPlayer, lane, die };

	if ( ! hasDiceBeenRolled( dice ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.ROLL_DICE_FIRST
				)
			)
		);
	}

	if ( ! isCurrentPlayer( { player, currentPlayer } ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.NOT_YOUR_CHECKER
				)
			)
		);
	}

	if ( ! validateDiceUse( { dice, checkers, currentPlayer, die } ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.MUST_USE_LARGER_DIE
				)
			)
		);
	}

	if ( isCheckerClearedOff( { lane, currentPlayer } ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.FINISHED_CHECKER
				)
			)
		);
	}

	if (
		hasWaitingChecker( { checkers, currentPlayer } ) &&
		isCheckerOnTheBoard( { lane } )
	) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.WAITING_CHECKER
				)
			)
		);
	}

	if (
		hasWaitingChecker( { checkers, currentPlayer } ) &&
		isTargetOccupiedByCurrentPlayer( playerObject )
	) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.TARGET_OCCUPIED_BY_YOU
				)
			)
		);
	}

	if (
		hasWaitingChecker( { checkers, currentPlayer } ) &&
		isTargetOccupiedByOtherPlayer( playerObject )
	) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.TARGET_OCCUPIED_BY_OPPONENT
				)
			)
		);
	}

	if ( isTargetOccupiedByCurrentPlayer( playerObject ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.TARGET_OCCUPIED_BY_YOU
				)
			)
		);
	}

	if ( isTargetOccupiedByOtherPlayer( playerObject ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.TARGET_OCCUPIED_BY_OPPONENT
				)
			)
		);
	}

	if (
		hasWaitingChecker( { checkers, currentPlayer } ) &&
		willHitOpponent( { checkers, currentPlayer, lane, die } )
	) {
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );

		if ( hitCheckerId === undefined ) {
			throw new Error( 'No checker found on target lane' );
		}

		newCheckers[ hitCheckerId - 1 ].lane =
			currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
		newCheckers[ id - 1 ].lane = targetLane;
		newDice.shift();

		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			MessageType.MOVE_WAITING_CHECKER_AND_HIT
		);

		updateGame( dispatch, newCheckers, newDice, notice, currentPlayer );
		checkForWin( dispatch, newCheckers, currentPlayer );
		return;
	}

	if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
		console.log( 'hasWaitingChecker' );
		newCheckers[ id - 1 ].lane = targetLane;
		newDice.shift();

		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			MessageType.MOVE_CHECKER_TO_BOARD
		);

		updateGame( dispatch, newCheckers, newDice, notice, currentPlayer );
		checkForWin( dispatch, newCheckers, currentPlayer );
		return;
	}

	if ( willHitOpponent( { checkers, currentPlayer, lane, die } ) ) {
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );

		if ( hitCheckerId === undefined ) {
			throw new Error( 'No checker found on target lane' );
		}

		newCheckers[ hitCheckerId - 1 ].lane = currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0; // prettier-ignore
		newCheckers[ id - 1 ].lane = targetLane;
		newDice.shift();

		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			MessageType.MOVE_CHECKER_AND_HIT
		);

		updateGame( dispatch, newCheckers, newDice, notice, currentPlayer );
		checkForWin( dispatch, newCheckers, currentPlayer );
		return;
	}

	if (
		hasCheckoutsOutsideEndzone( { checkers, currentPlayer } ) &&
		wouldClearOffChecker( { die, lane, currentPlayer } )
	) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.NOT_ALL_CHECKERS_IN_END_ZONE
				)
			)
		);
	}

	newCheckers[ id - 1 ].lane = targetLane;
	newDice.shift();

	const notice = createNotice(
		NoticeStatusType.SUCCESS,
		MessageType.MOVE_CHECKER
	);

	updateGame( dispatch, newCheckers, newDice, notice, currentPlayer );
	checkForWin( dispatch, newCheckers, currentPlayer );
};
