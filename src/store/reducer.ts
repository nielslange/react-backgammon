import {
  Action,
  INCREMENT,
  DECREMENT,
  ROLL_DICE,
  UPDATE_SCORE,
  SET_CURRENT_PLAYER,
  TOGGLE_CURRENT_PLAYER,
} from "./actions";
import { State } from "./state";

const initialState = {
  count: 0,
  dice: {
    one: 0,
    two: 0,
  },
  bonus: {
    one: 0,
    two: 0,
  },
  currentPlayer: "playerOne",
  scores: {
    playerOne: 0,
    playerTwo: 0,
  },
};

const reducer = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case INCREMENT:
      return {
        ...state,
        count: state.count + 1,
      };
    case DECREMENT:
      return {
        ...state,
        count: state.count - 1,
      };
    case ROLL_DICE:
      const diceOne = Math.floor(Math.random() * 6) + 1;
      const diceTwo = Math.floor(Math.random() * 6) + 1;
      return {
        ...state,
        dice: {
          one: diceOne,
          two: diceTwo,
        },
        bonus: {
          one: diceOne === diceTwo ? diceOne : 0,
          two: diceOne === diceTwo ? diceOne : 0,
        },
      };
    case UPDATE_SCORE:
      const player = action.currentPlayer;
      const updatedScore =
        player === "playerOne"
          ? state.scores.playerOne + 1
          : state.scores.playerTwo + 1;
      return {
        ...state,
        scores: {
          ...state.scores,
          [player]: updatedScore,
        },
      };
    case SET_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayer: action.currentPlayer,
      };
    case TOGGLE_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayer:
          state.currentPlayer === "playerOne" ? "playerTwo" : "playerOne",
      };
    default:
      return state;
  }
};

export default reducer;
