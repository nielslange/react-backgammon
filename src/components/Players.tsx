/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { useSelector, useDispatch } from 'react-redux';

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
	const gameOver = useSelector( ( state: StateType ) => state.gameOver );

	const handleToggleCurrentPlayer = () => {
		dispatch( toggleCurrentPlayer( currentPlayer ) );
		dispatch( rollDice() );
	};

	return (
		<div>
			<h2 className="h4">Player.tsx</h2>

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

			<ButtonGroup aria-label="Player actions" className="mb-3">
				<Button
					aria-label="Toggle the current player"
					variant="outline-primary"
					onClick={ handleToggleCurrentPlayer }
					disabled={ gameOver }
				>
					Toggle current player
				</Button>
			</ButtonGroup>
		</div>
	);
};
