/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

/**
 * Internal dependencies
 */
import { useDispatch, useSelector } from 'react-redux';
import { flipDice, rollDice, shiftDice } from '../data/actions';
import { canUseDie } from '../helpers/validateMoveHelper';
import { StateType } from '../types';

export const Dice = () => {
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const diceOne = useSelector( ( state: StateType ) => state.dice[ 0 ] );
	const diceTwo = useSelector( ( state: StateType ) => state.dice[ 1 ] );
	const bonusOne = useSelector( ( state: StateType ) => state.dice[ 2 ] );
	const bonusTwo = useSelector( ( state: StateType ) => state.dice[ 3 ] );
	const gameOver = useSelector( ( state: StateType ) => state.gameOver );
	const checkers = useSelector( ( state: StateType ) => state.checkers );
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);
	// A playable die must be played, so Shift may only discard a die that
	// cannot be used in the current position.
	const headDiePlayable =
		dice.length > 0 &&
		currentPlayer !== null &&
		canUseDie( dice[ 0 ], checkers, currentPlayer );

	return (
		<div>
			<h2 className="h6">Dice.tsx</h2>
			<table>
				<tbody>
					<tr>
						<td>Dice</td>
						<td>:</td>
						<td>{ dice }</td>
					</tr>
					<tr>
						<td>Dice one</td>
						<td>:</td>
						<td>{ diceOne }</td>
					</tr>
					<tr>
						<td>Dice two</td>
						<td>:</td>
						<td>{ diceTwo }</td>
					</tr>
					<tr>
						<td>Bonus one</td>
						<td>:</td>
						<td>{ bonusOne }</td>
					</tr>
					<tr>
						<td>Bonus two</td>
						<td>:</td>
						<td>{ bonusTwo }</td>
					</tr>
				</tbody>
			</table>

			<ButtonGroup aria-label="Dice actions" className="mb-3">
				<Button
					aria-label="Roll the dice"
					variant="outline-primary btn-sm"
					onClick={ () => dispatch( rollDice() ) }
					disabled={ gameOver || dice.length > 0 }
					title={
						dice.length > 0
							? 'You have already rolled this turn'
							: undefined
					}
				>
					Roll
				</Button>
				<Button
					aria-label="Flip the dice"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( flipDice( dice ) ) }
					disabled={ gameOver }
				>
					Flip
				</Button>
				<Button
					aria-label="Shift the dice"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( shiftDice( dice ) ) }
					disabled={
						gameOver || dice.length === 0 || headDiePlayable
					}
					title={
						headDiePlayable
							? 'This die can be played and must not be discarded'
							: undefined
					}
				>
					Shift
				</Button>
			</ButtonGroup>
		</div>
	);
};
