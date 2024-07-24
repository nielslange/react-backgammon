/**
 * External dependencies
 */
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@ariakit/react';

/**
 * Internal dependencies
 */
import { toggleCurrentPlayer, rollDice } from '../data/actions';
import { PlayerType, StateType } from '../types';

export const Players = () => {
	const dispatch = useDispatch();
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);

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
							{ currentPlayer === PlayerType.PLAYER_ONE
								? '2️⃣ ' + PlayerType.PLAYER_ONE
								: '1️⃣ ' + PlayerType.PLAYER_TWO }
						</td>
					</tr>
				</tbody>
			</table>

			<Button onClick={ handleToggleCurrentPlayer }>
				Toggle current player
			</Button>
		</div>
	);
};
