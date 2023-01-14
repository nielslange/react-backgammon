import { Provider } from "react-redux";
import store from "../store/store";
import Counter from "./Counter";
import Dice from "./Dice";
import Players from "./Players";

const Game = () => {
  return (
    <Provider store={store}>
      <Counter />
      <Dice />
      <Players />
    </Provider>
  );
};

export default Game;
