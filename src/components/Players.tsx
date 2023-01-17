import { useSelector, useDispatch } from "react-redux";
import {
  setCurrentPlayer,
  toggleCurrentPlayer,
  updateScore,
} from "../data/actions";

const Players = () => {
  const dispatch = useDispatch();
  const currentPlayer = useSelector((state: any) => state.currentPlayer);
  const PLAYER_ONEScore = useSelector((state: any) => state.scores.PLAYER_ONE);
  const PLAYER_TWOScore = useSelector((state: any) => state.scores.PLAYER_TWO);

  const handleToggleCurrentPlayer = () => {
    const player = currentPlayer === "PLAYER_ONE" ? "PLAYER_TWO" : "PLAYER_ONE";
    return dispatch(toggleCurrentPlayer({ player }));
  };

  const handleSetCurrentPlayer = (player: string) => {
    return dispatch(setCurrentPlayer(player));
  };

  const handleUpdateScore = (player: string, increase: number) => {
    const score =
      player === "PLAYER_ONE"
        ? PLAYER_ONEScore + increase
        : PLAYER_TWOScore + increase;
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
            <td>{PLAYER_ONEScore}</td>
          </tr>
          <tr>
            <td>Player 2 score</td>
            <td>:</td>
            <td>{PLAYER_TWOScore}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={handleToggleCurrentPlayer}>Toggle current player</button>
      <br />
      <button onClick={() => handleSetCurrentPlayer("PLAYER_ONE")}>
        Change to player one
      </button>
      <br />
      <button onClick={() => handleSetCurrentPlayer("PLAYER_TWO")}>
        Change to player two
      </button>
      <br />
      <button onClick={() => handleUpdateScore("PLAYER_ONE", 1)}>
        Increase score of player one
      </button>
      <br />
      <button onClick={() => handleUpdateScore("PLAYER_TWO", 1)}>
        Increase score of player two
      </button>
    </div>
  );
};

export default Players;
