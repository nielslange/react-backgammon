/**
 * Internal dependencies
 */
import { Lane } from './Lane';
import { PlayerType } from '../types';

export const Board = () => {
	return (
		<div>
			<h2 className="h6">Board.tsx</h2>

			<div className="board">
				<div className="board-top">
					<Lane from={ 13 } to={ 18 } />
					<Lane
						from={ 25 }
						to={ 25 }
						bar={ PlayerType.PLAYER_TWO }
						player={ PlayerType.PLAYER_TWO }
					/>
					<Lane from={ 19 } to={ 24 } />
					<Lane from={ 0 } to={ 0 } off={ PlayerType.PLAYER_TWO } />
				</div>

				<div className="board-bottom">
					<Lane from={ 12 } to={ 7 } />
					<Lane
						from={ 0 }
						to={ 0 }
						bar={ PlayerType.PLAYER_ONE }
						player={ PlayerType.PLAYER_ONE }
					/>
					<Lane from={ 6 } to={ 1 } />
					<Lane from={ 25 } to={ 25 } off={ PlayerType.PLAYER_ONE } />
				</div>
			</div>
		</div>
	);
};
