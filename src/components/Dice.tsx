import { useDispatch, useSelector } from 'react-redux';
import { rollDice, swapDice, shiftDice } from '../data/actions';

const Dice = () => {
	const dispatch = useDispatch();
	const dice = useSelector( ( state: any ) => state.dice );
	const diceOne = useSelector( ( state: any ) => state.dice[ 0 ] );
	const diceTwo = useSelector( ( state: any ) => state.dice[ 1 ] );
	const bonusOne = useSelector( ( state: any ) => state.dice[ 2 ] );
	const bonusTwo = useSelector( ( state: any ) => state.dice[ 3 ] );

	const handleRollDice = () => {
		const diceOne = Math.floor( Math.random() * 6 ) + 1;
		const diceTwo = Math.floor( Math.random() * 6 ) + 1;
		const bonusOne = diceOne === diceTwo ? diceOne : 0;
		const bonusTwo = diceOne === diceTwo ? diceOne : 0;

		if ( diceOne === diceTwo ) {
			return dispatch(
				rollDice( [ diceOne, diceTwo, bonusOne, bonusTwo ] )
			);
		}

		return dispatch( rollDice( [ diceOne, diceTwo ] ) );
	};

	const handleSwapDice = () => {
		if ( dice.length === 2 ) {
			return dispatch( swapDice( [ diceTwo, diceOne ] ) );
		}
		return dispatch( swapDice( [ ...dice ] ) );
	};

	const handleShiftDice = () => {
		switch ( dice.length ) {
			case 4:
				return dispatch( shiftDice( [ diceTwo, bonusOne, bonusTwo ] ) );
			case 3:
				return dispatch( shiftDice( [ diceTwo, bonusOne ] ) );
			case 2:
				return dispatch( shiftDice( [ diceTwo ] ) );
			default:
				return dispatch( shiftDice( [] ) );
		}
	};

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

			<button onClick={ handleRollDice }>Roll dice</button>
			<br />
			<button onClick={ handleSwapDice }>Swap dice</button>
			<br />
			<button onClick={ handleShiftDice }>Shift dice</button>
		</div>
	);
};

export default Dice;
