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
	const dice = useSelector( ( state: any ) => state.dice );
	const { className, id, player } = props;

	const handleClick = ( event: any ) => {
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

		// Check if any checker is on the bar and the current checker is not on the bar.
		if ( player === 'player1' && id > 24 ) {
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
		dispatch( shiftDice( [] ) );
	};

	return (
		<div
			className={ className }
			key={ id }
			data-checker={ id }
			data-player={ player }
			onClick={ handleClick }
		>
			{ id }
		</div>
	);
};

export default Checker;
