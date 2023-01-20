import { Omit } from 'utility-types';
import { useDispatch, useSelector } from 'react-redux';
import { moveChecker, shiftDice } from '../data/actions';
import { CheckerProps, Player } from '../data/state';

interface CustomCheckerProps extends Omit< CheckerProps, 'row' | 'state' > {
	className: string;
	currentPlayer: Player;
}

const Checker = ( props: CustomCheckerProps ) => {
	const dispatch = useDispatch();
	const currentPlayer = useSelector( ( state: any ) => state.currentPlayer );
	const checkers = useSelector( ( state: any ) => state.checkers );
	const dice = useSelector( ( state: any ) => state.dice );
	const { className, id, player } = props;

	const handleClick = ( event: any ) => {
		const lane = event.target.closest( '.lane' );

		// Check if dice is rolled.
		if ( dice.length === 0 ) {
			alert( '❌ Roll the dice first!' );
			return;
		}

		// Check if the checker belongs to the current player.
		const player = event.target.dataset.player;
		if ( player !== currentPlayer ) {
			alert( '❌ Not your turn!' );
			return;
		}

		// console.log( player );
		// console.log( currentPlayer );
		// console.log( id );
		console.log( checkers );
		console.log( lane.dataset.lane );

		// Check if any checker is on the bar and the current checker is not on the bar.
		if ( player === currentPlayer && lane.dataset.lane < 0 ) {
			alert( '❌ You have a checker on the bar!' );
			return;
		}

		// Check if the checker is on the board.
		// Check if the checker can be moved.
		// Check if the checker can be hit.
		// Check if the checker can be moved to the bar.
		// Check if the checker can be moved to the home.
		// Check if the checker can be moved to the board.

		alert( '✅ Your turn!' );
		dispatch( moveChecker( props ) );
		const diceValue = [ ...dice ];
		// diceValue.shift();
		dispatch( shiftDice( diceValue ) );
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
