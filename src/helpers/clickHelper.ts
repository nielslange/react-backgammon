/**
 * Internal dependencies
 */
import {
	moveChecker,
	rollDice,
	setDice,
	setNotice,
	toggleCurrentPlayer,
} from '../data/actions';
import {
	hasDiceBeenRolled,
	isCurrentPlayer,
	hasWaitingChecker,
	isFinishedChecker,
	isActiveChecker,
	isTargetOccupiedByCurrentPlayer,
	isTargetOccupiedByOtherPlayer,
	willHitOpponent,
	getTargetLane,
	getHitCheckerId,
} from '../data/selectors';
import type { NoticeType, PlayerType, CheckerType } from '../types';
import { MessageType, NoticeStatusType } from '../types';

const createNotice = (
	status: NoticeStatusType,
	message: MessageType
): NoticeType => ( {
	status,
	message,
} );

const updateGame = (
	dispatch: any,
	newCheckers: CheckerType[],
	newDice: number[],
	notice: NoticeType,
	currentPlayer: PlayerType
) => {
	dispatch( moveChecker( { checkers: newCheckers } ) );
	dispatch( setNotice( notice ) );
	dispatch( setDice( newDice ) );

	if ( ! newDice.length ) {
		dispatch( toggleCurrentPlayer( currentPlayer ) );
		dispatch( rollDice() );
	}
};

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

	if (
		hasWaitingChecker( { checkers, currentPlayer } ) &&
		isFinishedChecker( lane )
	) {
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
		isActiveChecker( lane )
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
					MessageType.OCCUPIED_BY_YOU
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
					MessageType.OCCUPIED_BY_OPPONENT
				)
			)
		);
	}

	if (
		hasWaitingChecker( { checkers, currentPlayer } ) &&
		willHitOpponent( { checkers, currentPlayer, lane, die } )
	) {
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );
		newCheckers[ hitCheckerId - 1 ].lane = 0;
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
		newCheckers[ id - 1 ].lane = targetLane;
		newDice.shift();

		const notice = createNotice(
			NoticeStatusType.SUCCESS,
			MessageType.MOVE_CHECKER_TO_GAME
		);
		return updateGame(
			dispatch,
			newCheckers,
			newDice,
			notice,
			currentPlayer
		);
	}

	if ( isTargetOccupiedByCurrentPlayer( playerObject ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.OCCUPIED_BY_YOU
				)
			)
		);
	}

	if ( isTargetOccupiedByOtherPlayer( playerObject ) ) {
		return dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.ERROR,
					MessageType.OCCUPIED_BY_OPPONENT
				)
			)
		);
	}

	if ( willHitOpponent( { checkers, currentPlayer, lane, die } ) ) {
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );
		newCheckers[ hitCheckerId - 1 ].lane = 0;
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

	newCheckers[ id - 1 ].lane = targetLane;
	newDice.shift();

	const notice = createNotice(
		NoticeStatusType.SUCCESS,
		MessageType.MOVE_CHECKER
	);
	updateGame( dispatch, newCheckers, newDice, notice, currentPlayer );
};
