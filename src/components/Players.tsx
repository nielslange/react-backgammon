import { useSelector, useDispatch } from 'react-redux';
import { toggleCurrentPlayer, rollDice } from '../data/actions';

const Players = () => {
	const dispatch = useDispatch();
	const currentPlayer = useSelector( ( state: any ) => state.currentPlayer );

	const handleToggleCurrentPlayer = () => {
		dispatch( toggleCurrentPlayer( { currentPlayer } ) );
		dispatch( rollDice() );
	};

	return (
		<div>
			<h2>Player.tsx</h2>

			<table>
				<tbody>
					<tr>
						<td>Current player</td>
						<td>:</td>
						<td>{ currentPlayer }</td>
					</tr>
				</tbody>
			</table>

			<button onClick={ handleToggleCurrentPlayer }>
				Toggle current player
			</button>
		</div>
	);
};

export default Players;
