/**
 * External dependencies
 */
import { useDispatch, useSelector } from 'react-redux';

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
import type { NoticeType, PlayerType, StateType } from '../types';
import { MessageType, NoticeStatusType } from '../types';

export const Checker = ( props: any ) => {
	const { className, id, player } = props;
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const currentPlayer: PlayerType = useSelector(
		( state: StateType ) => state.currentPlayer
	);
	const checkers = useSelector( ( state: StateType ) => state.checkers );
	const die = dice[ 0 ];

	const handleClick = ( event: any ) => {
		let notice: NoticeType;
		const lane = parseInt( event.target.closest( '.lane' ).dataset.lane );
		const player = event.target.dataset.player;
		const tagetLane = getTargetLane( { currentPlayer, lane, die } );
		const newCheckers = JSON.parse( JSON.stringify( checkers ) );
		const newDice = [ ...dice ];
		const playerObject = { checkers, currentPlayer, lane, die };

		if ( ! hasDiceBeenRolled( dice ) ) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.ROLL_DICE_FIRST,
			};
			return dispatch( setNotice( notice ) );
		}

		if ( ! isCurrentPlayer( { player, currentPlayer } ) ) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.NOT_YOUR_CHECKER,
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isFinishedChecker( lane )
		) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.FINISHED_CHECKER,
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isActiveChecker( lane )
		) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.WAITING_CHECKER,
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isTargetOccupiedByCurrentPlayer( playerObject )
		) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.OCCUPIED_BY_YOU,
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isTargetOccupiedByOtherPlayer( playerObject )
		) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.OCCUPIED_BY_OPPONENT,
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			willHitOpponent( { checkers, currentPlayer, lane, die } )
		) {
			const hitCheckerId = getHitCheckerId( {
				checkers,
				lane: tagetLane,
			} );

			newCheckers[ hitCheckerId - 1 ].lane = 0;
			newCheckers[ id - 1 ].lane = tagetLane;
			newDice.shift();
			notice = {
				status: NoticeStatusType.SUCCESS,
				message: MessageType.MOVE_WAITING_CHECKER_AND_HIT,
			};

			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setNotice( notice ) );
			dispatch( setDice( newDice ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( currentPlayer ) );
				dispatch( rollDice() );
			}

			return;
		}

		if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
			newCheckers[ id - 1 ].lane = tagetLane;
			newDice.shift();
			notice = {
				message: MessageType.MOVE_CHECKER_TO_GAME,
				status: NoticeStatusType.SUCCESS,
			};

			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setNotice( notice ) );
			dispatch( setDice( newDice ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( currentPlayer ) );
				dispatch( rollDice() );
			}

			return;
		}

		if ( isTargetOccupiedByCurrentPlayer( playerObject ) ) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.OCCUPIED_BY_YOU,
			};
			return dispatch( setNotice( notice ) );
		}

		if ( isTargetOccupiedByOtherPlayer( playerObject ) ) {
			notice = {
				status: NoticeStatusType.ERROR,
				message: MessageType.OCCUPIED_BY_OPPONENT,
			};
			return dispatch( setNotice( notice ) );
		}

		if ( willHitOpponent( { checkers, currentPlayer, lane, die } ) ) {
			const hitCheckerId = getHitCheckerId( {
				checkers,
				lane: tagetLane,
			} );
			newCheckers[ hitCheckerId - 1 ].lane = 0;
			newCheckers[ id - 1 ].lane = tagetLane;
			newDice.shift();
			notice = {
				status: NoticeStatusType.SUCCESS,
				message: MessageType.MOVE_CHECKER_AND_HIT,
			};
			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setNotice( notice ) );
			dispatch( setDice( newDice ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( currentPlayer ) );
				dispatch( rollDice() );
			}

			return;
		}

		newCheckers[ id - 1 ].lane = tagetLane;
		newDice.shift();
		notice = {
			status: NoticeStatusType.SUCCESS,
			message: MessageType.MOVE_CHECKER,
		};

		dispatch( moveChecker( { checkers: newCheckers } ) );
		dispatch( setNotice( notice ) );
		dispatch( setDice( newDice ) );

		if ( ! newDice.length ) {
			dispatch( toggleCurrentPlayer( currentPlayer ) );
			dispatch( rollDice() );
		}
	};

	return (
		<div
			key={ id }
			className={ className }
			data-checker={ id }
			data-player={ player }
			onClick={ handleClick }
		>
			{ id }
		</div>
	);
};
