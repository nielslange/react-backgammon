import { useSelector, useDispatch } from "react-redux";
import {
  setCurrentPlayer,
  toggleCurrentPlayer,
  updateScore,
} from "../data/actions";

const Players = () => {
  const dispatch = useDispatch();
  const currentPlayer = useSelector((state: any) => state.currentPlayer);
  const playerOneScore = useSelector((state: any) => state.scores.playerOne);
  const playerTwoScore = useSelector((state: any) => state.scores.playerTwo);

  const handleToggleCurrentPlayer = () => {
    const player = currentPlayer === "playerOne" ? "playerTwo" : "playerOne";
    return dispatch(toggleCurrentPlayer({ player }));
  };

  const handleSetCurrentPlayer = (player: string) => {
    return dispatch(setCurrentPlayer(player));
  };

  const handleUpdateScore = (player: string, increase: number) => {
    const score =
      player === "playerOne"
        ? playerOneScore + increase
        : playerTwoScore + increase;
    console.log({ player, score });
    return dispatch(updateScore(player, score));
  };

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

      <button onClick={handleToggleCurrentPlayer}>Toggle current player</button>
      <br />
      <button onClick={() => handleSetCurrentPlayer("playerOne")}>
        Change to player one
      </button>
      <br />
      <button onClick={() => handleSetCurrentPlayer("playerTwo")}>
        Change to player two
      </button>
      <br />
      <button onClick={() => handleUpdateScore("playerOne", 1)}>
        Increase score of player one
      </button>
      <br />
      <button onClick={() => handleUpdateScore("playerTwo", 1)}>
        Increase score of player two
      </button>
    </div>
  );
};

export default Players;
