/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

/**
 * Internal dependencies
 */
import { useDispatch, useSelector } from 'react-redux';
import {
	flipDice,
	restartGame,
	rollDice,
	shiftDice,
	surrenderGame,
	undoMove,
} from '../data/actions';
import { StateType } from '../types';

export const GameState = () => {
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const gameOver = useSelector( ( state: StateType ) => state.gameOver );
	const moveHistory = useSelector(
		( state: StateType ) => state.moveHistory
	);

	return (
		<>
			<h2 className="h6">GameState.tsx</h2>
			<ButtonGroup aria-label="Game actions" className="mb-3">
				<Button
					aria-label="Restart the game"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( restartGame() ) }
				>
					Restart
				</Button>
				<Button
					aria-label="Surrender the game"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( surrenderGame() ) }
					disabled={ gameOver }
				>
					Surrender
				</Button>
				<Button
					aria-label="Undo last move"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( undoMove() ) }
					disabled={ gameOver || moveHistory.length === 0 }
				>
					Undo
				</Button>
			</ButtonGroup>
		</>
	);
};
