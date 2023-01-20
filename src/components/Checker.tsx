import { Omit } from 'utility-types';
import { useDispatch, useSelector } from 'react-redux';
import {
	moveChecker,
	rollDice,
	setDice,
	setMessage,
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
		let message: string[] = [];
		const lane = parseInt( event.target.closest( '.lane' ).dataset.lane );
		const player = event.target.dataset.player;
		const tagetLane = getTargetLane( { currentPlayer, lane, die } );
		const newCheckers = JSON.parse( JSON.stringify( checkers ) );
		const newDice = [ ...dice ];
		const playerObject = { checkers, currentPlayer, lane, die };

		if ( ! hasDiceBeenRolled( dice ) ) {
			message.push( '❌ You need to roll the dice first!' );
			return dispatch( setMessage( message ) );
		}

		if ( ! isCurrentPlayer( { player, currentPlayer } ) ) {
			message.push( '❌ This is not your checker!' );
			return dispatch( setMessage( message ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isFinishedChecker( lane )
		) {
			message.push( '❌ You cannot add a finished checker to the game!' );
			return dispatch( setMessage( message ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isActiveChecker( lane )
		) {
			message.push( '❌ You need to add the waiting checker first!' );
			return dispatch( setMessage( message ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isFinishedChecker( lane )
		) {
			message.push( '❌ You cannot add a finished checker to the game!' );
			return dispatch( setMessage( message ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isTargetOccupiedByCurrentPlayer( playerObject )
		) {
			message.push( '❌ The target lane is occupied by your checkers!' );
			return dispatch( setMessage( message ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			isTargetOccupiedByOtherPlayer( playerObject )
		) {
			message.push(
				"❌ The target lane is occupied by your opponent's checkers!"
			);
			return dispatch( setMessage( message ) );
		}

		if (
			hasWaitingChecker( { checkers, currentPlayer } ) &&
			willHitOpponent( { checkers, currentPlayer, lane, die } )
		) {
			newCheckers[ id - 1 ].lane = tagetLane;
			newDice.shift();
			message.push(
				"✅ Move waiting checker to the game and hit your opponent's checker!"
			);

			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setDice( newDice ) );
			dispatch( setMessage( message ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( { currentPlayer } ) );
				dispatch( rollDice() );
			}

			return;
		}

		if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
			newCheckers[ id - 1 ].lane = tagetLane;
			newDice.shift();
			message.push( '✅ Move waiting checker to the game!' );

			dispatch( moveChecker( { checkers: newCheckers } ) );
			dispatch( setDice( newDice ) );
			dispatch( setMessage( message ) );

			if ( ! newDice.length ) {
				dispatch( toggleCurrentPlayer( { currentPlayer } ) );
				dispatch( rollDice() );
			}

			return;
		}

		if ( isTargetOccupiedByCurrentPlayer( playerObject ) ) {
			message.push( '❌ The target lane is occupied by your checkers!' );
			return dispatch( setMessage( message ) );
		}

		if ( isTargetOccupiedByOtherPlayer( playerObject ) ) {
			message.push(
				"❌ The target lane is occupied by your opponent's checkers!"
			);
			return dispatch( setMessage( message ) );
		}

		if ( willHitOpponent( { checkers, currentPlayer, lane, die } ) ) {
			message.push( "✅ Move checker and hit your opponent's checker!" );
			return dispatch( setMessage( message ) );
		}

		message.push( '✅ Your turn!' );
		dispatch( setMessage( message ) );
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
