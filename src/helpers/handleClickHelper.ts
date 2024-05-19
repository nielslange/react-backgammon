/**
 * Internal dependencies
 */
import { setNotice } from '../data/actions';
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
} from '../data/selectors';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import { updateGame, createNotice } from '.';

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
		console.log( 'hasDiceBeenRolled' );
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
		console.log( 'isCurrentPlayer' );
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.NOT_YOUR_CHECKER
				)
			)
		);
	}

	if ( isCheckerClearedOff( { lane, currentPlayer } ) ) {
		console.log( 'isCheckerClearedOff' );
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
		console.log( 'hasWaitingChecker && isCheckerOnTheBoard' );
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
		isCheckerOnTheBoard( { lane } )
	) {
		console.log( 'hasWaitingChecker && isCheckerOnTheBoard' );
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
		console.log( 'hasWaitingChecker && isTargetOccupiedByCurrentPlayer' );
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
		console.log( 'hasWaitingChecker && isTargetOccupiedByOtherPlayer' );
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
		console.log( 'isTargetOccupiedByCurrentPlayer' );
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
		console.log( 'isTargetOccupiedByOtherPlayer' );
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
		console.log( 'hasWaitingChecker && willHitOpponent' );
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );
		newCheckers[ hitCheckerId - 1 ].lane =
			currentPlayer === PlayerType.PLAYER_BLUE ? 25 : 0;
		newCheckers[ id - 1 ].lane = targetLane;
		newDice.shift();

		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			MessageType.MOVE_WAITING_CHECKER_AND_HIT
		);
		return updateGame(
			dispatch,
			newCheckers,
			newDice,
			notice,
			currentPlayer
		);
	}

	if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
		console.log( 'hasWaitingChecker' );
		newCheckers[ id - 1 ].lane = targetLane;
		newDice.shift();

		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			MessageType.MOVE_CHECKER_TO_BOARD
		);
		return updateGame(
			dispatch,
			newCheckers,
			newDice,
			notice,
			currentPlayer
		);
	}

	if ( willHitOpponent( { checkers, currentPlayer, lane, die } ) ) {
		console.log( 'willHitOpponent' );
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );
		newCheckers[ hitCheckerId - 1 ].lane =
			currentPlayer === PlayerType.PLAYER_BLUE ? 25 : 0;
		newCheckers[ id - 1 ].lane = targetLane;
		newDice.shift();

		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			MessageType.MOVE_CHECKER_AND_HIT
		);

		return updateGame(
			dispatch,
			newCheckers,
			newDice,
			notice,
			currentPlayer
		);
	}

	// if ( hasCheckoutsOutsideEndzone( { checkers, currentPlayer } ) ) {
	// 	console.log( 'hasCheckoutsOutsideEndzone' );
	// 	return dispatch(
	// 		setNotice(
	// 			createNotice(
	// 				NoticeStatusType.ERROR,
	// 				MessageType.NOT_ALL_CHECKERS_IN_END_ZONE
	// 			)
	// 		)
	// 	);
	// }

	console.log( 'DEFAULT' );

	newCheckers[ id - 1 ].lane = targetLane;
	newDice.shift();

	const notice = createNotice(
		NoticeStatusType.SUCCESS,
		MessageType.MOVE_CHECKER
	);
	updateGame( dispatch, newCheckers, newDice, notice, currentPlayer );
};
