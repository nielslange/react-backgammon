import { Omit } from 'utility-types';
import { useDispatch, useSelector } from 'react-redux';
import {
	moveChecker,
	rollDice,
	setDice,
	setNotice,
	toggleCurrentPlayer,
} from '../data/actions';
import { CheckerProps, Player } from '../data/state';
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

interface CustomCheckerProps extends Omit< CheckerProps, 'lane' > {
	className: string;
	currentPlayer: Player;
}

const Checker = ( props: CustomCheckerProps ) => {
	const { className, id, player } = props;
	const dispatch = useDispatch();
	const dice = useSelector( ( state: any ) => state.dice );
	const currentPlayer = useSelector( ( state: any ) => state.currentPlayer );
	const checkers = useSelector( ( state: any ) => state.checkers );
	const die = dice[ 0 ];

	const handleClick = ( event: any ) => {
		let notice = {
			type: '',
			message: '',
		};
		const lane = parseInt( event.target.closest( '.lane' ).dataset.lane );
		const player = event.target.dataset.player;
		const tagetLane = getTargetLane( { currentPlayer, lane, die } );
		const newCheckers = JSON.parse( JSON.stringify( checkers ) );
		const newDice = [ ...dice ];
		const playerObject = { checkers, currentPlayer, lane, die };

		if ( ! hasDiceBeenRolled( dice ) ) {
			notice = {
				type: 'error',
				message: 'You need to roll the dice first!',
			};
			return dispatch( setNotice( notice ) );
		}

		if ( ! isCurrentPlayer( { player, currentPlayer } ) ) {
			notice = {
				type: 'error',
				message: 'This is not your checker!',
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isFinishedChecker( lane )
		) {
			notice = {
				type: 'error',
				message: 'You cannot add a finished checker to the game!',
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isActiveChecker( lane )
		) {
			notice = {
				type: 'error',
				message: 'You need to add the waiting checker first!',
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isFinishedChecker( lane )
		) {
			notice = {
				type: 'error',
				message: 'You cannot add a finished checker to the game!',
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isTargetOccupiedByCurrentPlayer( playerObject )
		) {
			notice = {
				type: 'error',
				message: 'The target lane is occupied by your checkers!',
			};
			return dispatch( setNotice( notice ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isTargetOccupiedByOtherPlayer( playerObject )
		) {
			notice = {
				type: 'error',
				message:
					"The target lane is occupied by your opponent's checkers!",
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
				type: 'success',
				message:
					"Move waiting checker to the game and hit your opponent's checker!",
			};

			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setNotice( notice ) );
			dispatch( setDice( newDice ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( { currentPlayer } ) );
				dispatch( rollDice() );
			}

			return;
		}

		if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
			newCheckers[ id - 1 ].lane = tagetLane;
			newDice.shift();
			notice = {
				type: 'success',
				message: 'Move waiting checker to the game!',
			};

			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setNotice( notice ) );
			dispatch( setDice( newDice ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( { currentPlayer } ) );
				dispatch( rollDice() );
			}

			return;
		}

		if ( isTargetOccupiedByCurrentPlayer( playerObject ) ) {
			notice = {
				type: 'error',
				message: 'The target lane is occupied by your checkers!',
			};
			return dispatch( setNotice( notice ) );
		}

		if ( isTargetOccupiedByOtherPlayer( playerObject ) ) {
			notice = {
				type: 'error',
				message:
					"The target lane is occupied by your opponent's checkers!",
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
				type: 'success',
				message: "Move checker and hit your opponent's checker!",
			};
			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setNotice( notice ) );
			dispatch( setDice( newDice ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( { currentPlayer } ) );
				dispatch( rollDice() );
			}

			return;
		}

		newCheckers[ id - 1 ].lane = tagetLane;
		newDice.shift();
		notice = {
			type: 'success',
			message: 'Move checker!',
		};

		dispatch( moveChecker( { checkers: newCheckers } ) );
		dispatch( setNotice( notice ) );
		dispatch( setDice( newDice ) );

		if ( ! newDice.length ) {
			dispatch( toggleCurrentPlayer( { currentPlayer } ) );
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

export default Checker;
