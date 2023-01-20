import { Provider } from 'react-redux';
import store from '../data/store';
import Dice from './Dice';
import Players from './Players';
import Board from './Board';
import Message from './Message';

const Game = () => {
	return (
		<div className="game">
			<Provider store={ store }>
				<div>
					<Board />
				</div>
				<div>
					<Dice />
					<Players />
					<Message />
				</div>
			</Provider>
		</div>
	);
};

export default Game;
