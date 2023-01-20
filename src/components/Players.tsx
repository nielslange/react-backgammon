import { useSelector, useDispatch } from 'react-redux';
import { toggleCurrentPlayer } from '../data/actions';

const Players = () => {
	const dispatch = useDispatch();
	const currentPlayer = useSelector( ( state: any ) => state.currentPlayer );

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

			<button onClick={ () => dispatch( toggleCurrentPlayer( { currentPlayer } ) ) }>Toggle current player</button>
		</div>
	);
};

export default Players;
