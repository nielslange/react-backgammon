'use client';

/**
 * External dependencies
 */
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { newGame } from '../data/gameSlice';
import type { AppDispatch, RootState } from '../data/store';
import { getFormattedPlayerNameWithEmoji } from '../helpers/playerNameHelper';
import { Button } from './primitives/Button';

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

			<div role="group" aria-label="Player actions" className="mb-3 flex gap-2">
				<Button
					aria-label="Start the game"
					variant="primary"
					onClick={ () =>
						dispatch( newGame( { variant: 'backgammon' } ) )
					}
					disabled={ ! canStart }
				>
					Start game
				</Button>
			</div>
		</div>
	);
};
