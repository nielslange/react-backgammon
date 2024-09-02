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
			<h2 className="h6">GameState.tsx</h2>
			<ButtonGroup aria-label="Game actions" className="mb-3">
				<Button
					aria-label="Restart the game"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( rollDice() ) }
					disabled={ gameOver }
				>
					Restart
				</Button>
				<Button
					aria-label="Surrender the game"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( flipDice( dice ) ) }
					disabled={ gameOver }
				>
					Surrender
				</Button>
			</ButtonGroup>
		</>
	);
};
