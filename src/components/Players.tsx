/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { useSelector, useDispatch, useStore } from 'react-redux';

/**
 * Internal dependencies
 */
import { toggleCurrentPlayer, rollDice } from '../data/actions';
import { checkAndHandleNoValidMoves } from '../helpers/noValidMovesHelper';
import { getFormattedPlayerNameWithEmoji } from '../helpers/playerNameHelper';
import { PlayerType, StateType } from '../types';

export const Players = () => {
	const dispatch = useDispatch();
	const store = useStore< StateType >();
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);
	const gameOver = useSelector( ( state: StateType ) => state.gameOver );

	const handleToggleCurrentPlayer = () => {
		if ( currentPlayer === null ) {
			// If no player is selected yet, first roll establishes PLAYER_ONE
			dispatch( {
				type: 'TOGGLE_CURRENT_PLAYER',
				player: PlayerType.PLAYER_ONE,
			} );
		} else {
			dispatch( toggleCurrentPlayer( currentPlayer ) );
		}
		dispatch( rollDice() );
		const state = store.getState();
		if ( state.currentPlayer === null ) return;
		checkAndHandleNoValidMoves( {
			dispatch,
			checkers: state.checkers,
			dice: state.dice,
			currentPlayer: state.currentPlayer,
		} );
	};

	return (
		<div>
			<h2 className="h6">Player.tsx</h2>

			<table>
				<tbody>
					<tr>
						<td>Current</td>
						<td>:</td>
						<td>
							{ getFormattedPlayerNameWithEmoji( currentPlayer ) }
						</td>
					</tr>
				</tbody>
			</table>

			<ButtonGroup aria-label="Player actions" className="mb-3">
				<Button
					aria-label="Toggle the current player"
					variant="outline-primary btn-sm"
					onClick={ handleToggleCurrentPlayer }
					disabled={ gameOver }
				>
					{ currentPlayer === null
						? 'Start Game'
						: 'Toggle current player' }
				</Button>
			</ButtonGroup>
		</div>
	);
};
