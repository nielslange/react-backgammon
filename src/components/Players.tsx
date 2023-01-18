import { useSelector, useDispatch } from 'react-redux';
import { toggleCurrentPlayer } from '../data/actions';

const Players = () => {
	const dispatch = useDispatch();
	const currentPlayer = useSelector( ( state: any ) => state.currentPlayer );

	const handleToggleCurrentPlayer = () => {
		const player =
			currentPlayer === 'PLAYER_ONE' ? 'PLAYER_TWO' : 'PLAYER_ONE';
		return dispatch( toggleCurrentPlayer( { player } ) );
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
