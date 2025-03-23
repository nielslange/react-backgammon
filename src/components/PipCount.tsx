/**
 * External dependencies
 */
import { useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { PlayerType, StateType } from '../types';

export const PipCount = () => {
	const pipCount = useSelector( ( state: StateType ) => state.pipCount );
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);

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
							{ pipCount[ PlayerType.PLAYER_ONE ] -
								pipCount[ PlayerType.PLAYER_TWO ] >
							0
								? `+${
										pipCount[ PlayerType.PLAYER_ONE ] -
										pipCount[ PlayerType.PLAYER_TWO ]
								  }`
								: pipCount[ PlayerType.PLAYER_ONE ] -
								  pipCount[ PlayerType.PLAYER_TWO ] }
						</td>
						<td></td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};
