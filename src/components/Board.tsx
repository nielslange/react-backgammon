import Lane from "./Lane";

const Board = () => {
  return (
    <div>
      <h2>Board.tsx</h2>

      <div className="board">
        <div className="board-top">
          <Lane from={13} to={24} />
        </div>
        <div className="board-bottom">
          <Lane from={12} to={1} />
        </div>
      </div>
    </div>
  );
};
export default Board;
