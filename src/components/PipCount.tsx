'use client';

/**
 * External dependencies
 */
import { useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { selectPipCounts } from '../data/selectors';
import type { RootState } from '../data/store';
import { PlayerType } from '../types';

export const PipCount = () => {
	const pipCount = useSelector( selectPipCounts );
	const currentPlayer = useSelector(
		( root: RootState ) => root.game.state.player
	);
	const difference =
		pipCount[ PlayerType.PLAYER_ONE ] - pipCount[ PlayerType.PLAYER_TWO ];

	return (
		<div>
			<h2 className="h6">Pip Count</h2>
			<table>
				<tbody>
					<tr>
						<td>Blue (Player 1)</td>
						<td>:</td>
						<td>{ pipCount[ PlayerType.PLAYER_ONE ] }</td>
						<td>
							{ currentPlayer === PlayerType.PLAYER_ONE
								? '(current)'
								: '' }
						</td>
					</tr>
					<tr>
						<td>Red (Player 2)</td>
						<td>:</td>
						<td>{ pipCount[ PlayerType.PLAYER_TWO ] }</td>
						<td>
							{ currentPlayer === PlayerType.PLAYER_TWO
								? '(current)'
								: '' }
						</td>
					</tr>
					<tr>
						<td>Difference</td>
						<td>:</td>
						<td>
							{ difference > 0 ? `+${ difference }` : difference }
						</td>
						<td></td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};
