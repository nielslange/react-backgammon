/**
 * External dependencies
 */
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import { store } from '../data/store';
import { Dice } from './Dice';
import { Players } from './Players';
import { Board } from './Board';
import { Notice } from './Notice';

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
					<Notice />
				</div>
			</Provider>
		</div>
	);
};
