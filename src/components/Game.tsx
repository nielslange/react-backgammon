import { Provider } from 'react-redux';
import store from '../data/store';
import Dice from './Dice';
import Players from './Players';
import Board from './Board';
import Message from './Message';

const Game = () => {
	return (
		<Provider store={ store }>
			<Dice />
			<Players />
			<Message />
			<Board />
		</Provider>
	);
};

export default Game;
