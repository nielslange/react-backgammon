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
} from '../data/actions';
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
			</ButtonGroup>

			<h2 className="h6">Development Controls</h2>
			<ButtonGroup aria-label="Development actions" className="mb-3">
				<Button
					aria-label="Roll the dice (Dev)"
					variant="outline-primary btn-sm"
					onClick={ () => dispatch( rollDice() ) }
					disabled={ gameOver }
				>
					Roll
				</Button>
				<Button
					aria-label="Flip the dice (Dev)"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( flipDice( dice ) ) }
					disabled={ gameOver }
				>
					Flip
				</Button>
				<Button
					aria-label="Shift the dice (Dev)"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( shiftDice( dice ) ) }
					disabled={ gameOver }
				>
					Shift
				</Button>
			</ButtonGroup>
		</>
	);
};
