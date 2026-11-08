/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { newGame } from '../data/gameSlice';
import type { AppDispatch, RootState } from '../data/store';
import { getFormattedPlayerNameWithEmoji } from '../helpers/playerNameHelper';

export const Players = () => {
	const dispatch = useDispatch< AppDispatch >();
	const currentPlayer = useSelector(
		( root: RootState ) => root.game.state.player
	);
	const phase = useSelector( ( root: RootState ) => root.game.state.phase );
	const canStart = phase === 'idle' || phase === 'over';

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
					aria-label="Start the game"
					variant="outline-primary btn-sm"
					onClick={ () =>
						dispatch( newGame( { variant: 'backgammon' } ) )
					}
					disabled={ ! canStart }
				>
					Start game
				</Button>
			</ButtonGroup>
		</div>
	);
};
