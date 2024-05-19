/**
 * External dependencies
 */
import { useSelector, useDispatch } from 'react-redux';

/**
 * Internal dependencies
 */
import { toggleCurrentPlayer, rollDice } from '../data/actions';
import { PlayerType } from '../types';

export const Players = () => {
	const dispatch = useDispatch();
	const currentPlayer = useSelector( ( state: any ) => state.currentPlayer );

	const handleToggleCurrentPlayer = () => {
		dispatch( toggleCurrentPlayer( currentPlayer ) );
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
						<td>
							{ currentPlayer === PlayerType.PLAYER_BLUE
								? '🔵 ' + PlayerType.PLAYER_BLUE
								: '🔴 ' + PlayerType.PLAYER_RED }
						</td>
					</tr>
				</tbody>
			</table>

			<div className="button-group">
				<button onClick={ handleToggleCurrentPlayer }>
					Toggle current player
				</button>
			</div>
		</div>
	);
};
