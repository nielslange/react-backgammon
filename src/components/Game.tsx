import { Provider } from 'react-redux';
import store from '../data/store';
import Dice from './Dice';
import Players from './Players';
import Board from './Board';

const Game = () => {
	return (
		<Provider store={ store }>
			<Dice />
			<Players />
			<Board />
		</Provider>
	);
};

export default Game;
