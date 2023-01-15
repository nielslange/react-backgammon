import { Provider } from "react-redux";
import store from "../store/store";
import Counter from "./Counter";
import Dice from "./Dice";
import Players from "./Players";
import Checker from "./Checker";
import Board from "./Board";

const Game = () => {
  return (
    <Provider store={store}>
      <Checker />
      <Counter />
      <Dice />
      <Players />
      <Board />
    </Provider>
  );
};

export default Game;
