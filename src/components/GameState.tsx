/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

/**
 * Internal dependencies
 */
import { useDispatch, useSelector } from 'react-redux';
import { flipDice, rollDice } from '../data/actions';
import { StateType } from '../types';

export const GameState = () => {
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const gameOver = useSelector( ( state: StateType ) => state.gameOver );

	return (
		<>
			<h2 className="h4">GameState.tsx</h2>
			<ButtonGroup aria-label="Dice buttons" className="mb-3">
				<Button
					aria-label="Roll the dice"
					variant="outline-secondary"
					onClick={ () => dispatch( rollDice() ) }
					disabled={ gameOver }
				>
					Restart
				</Button>
				<Button
					aria-label="Flip the dice"
					variant="outline-secondary"
					onClick={ () => dispatch( flipDice( dice ) ) }
					disabled={ gameOver }
				>
					Surrender
				</Button>
			</ButtonGroup>
		</>
	);
};
