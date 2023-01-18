import Lane from './Lane';

const Board = () => {
	return (
		<div>
			<h2>Board.tsx</h2>

			<div className="board">
				<div className="board-top">
					<Lane from={ -1 } to={ -1 } player="PLAYER_ONE" />
					<Lane from={ 13 } to={ 24 } />
					<Lane from={ 25 } to={ 25 } player="PLAYER_ONE" />
				</div>
				<div className="board-bottom">
					<Lane from={ -1 } to={ -1 } player="PLAYER_TWO" />
					<Lane from={ 12 } to={ 1 } />
					<Lane from={ 25 } to={ 25 } player="PLAYER_TWO" />
				</div>
			</div>
		</div>
	);
};
export default Board;
