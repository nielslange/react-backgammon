/**
 * External dependencies
 */
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import { store } from '../data/store';
import { Board, Dice, GameState, Notice, Players } from '.';

export const Game = () => {
	return (
		<div className="game">
			<Provider store={ store }>
				<div>
					<Board />
				</div>
				<div>
					<Dice />
					<Players />
					<GameState />
					<Notice />
				</div>
			</Provider>
		</div>
	);
};
