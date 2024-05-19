import { useDispatch, useSelector } from 'react-redux';
import { flipDice, rollDice, shiftDice } from '../data/actions';
import { StateType } from '../types';

export const Dice = () => {
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const diceOne = useSelector( ( state: StateType ) => state.dice[ 0 ] );
	const diceTwo = useSelector( ( state: StateType ) => state.dice[ 1 ] );
	const bonusOne = useSelector( ( state: StateType ) => state.dice[ 2 ] );
	const bonusTwo = useSelector( ( state: StateType ) => state.dice[ 3 ] );

	return (
		<div>
			<h2>Dice.tsx</h2>
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
			<button onClick={ () => dispatch( rollDice() ) }>Roll dice</button>
			<button onClick={ () => dispatch( flipDice( dice ) ) }>
				Flip dice
			</button>
			<button onClick={ () => dispatch( shiftDice( dice ) ) }>
				Shift dice
			</button>
		</div>
	);
};
