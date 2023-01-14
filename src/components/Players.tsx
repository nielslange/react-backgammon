import { useSelector, useDispatch } from "react-redux";
import {
  setCurrentPlayer,
  toggleCurrentPlayer,
  updateScore,
} from "../store/actions";

const Players = () => {
  const dispatch = useDispatch();
  const currentPlayer = useSelector((state: any) => state.currentPlayer);
  const playerOneScore = useSelector((state: any) => state.scores.playerOne);
  const playerTwoScore = useSelector((state: any) => state.scores.playerTwo);

  return (
    <div>
      <h2>Player.tsx</h2>

      <table>
        <tbody>
          <tr>
            <td>Current player</td>
            <td>:</td>
            <td>{currentPlayer}</td>
          </tr>
          <tr>
            <td>Player 1 score</td>
            <td>:</td>
            <td>{playerOneScore}</td>
          </tr>
          <tr>
            <td>Player 2 score</td>
            <td>:</td>
            <td>{playerTwoScore}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => dispatch(toggleCurrentPlayer())}>
        Toggle current player
      </button>
      <br />
      <button onClick={() => dispatch(setCurrentPlayer("playerOne"))}>
        Change to player one
      </button>
      <br />
      <button onClick={() => dispatch(setCurrentPlayer("playerTwo"))}>
        Change to player two
      </button>
      <br />
      <button
        onClick={() => dispatch(updateScore("playerOne", playerOneScore + 1))}
      >
        Increase score of player one
      </button>
      <br />
      <button
        onClick={() => dispatch(updateScore("playerTwo", playerTwoScore + 1))}
      >
        Increase score of player two
      </button>
    </div>
  );
};

export default Players;
