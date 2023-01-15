import {
  INCREMENT,
  DECREMENT,
  ROLL_DICE,
  SWAP_DICE,
  SHIFT_DICE,
  UPDATE_SCORE,
  SET_CURRENT_PLAYER,
  TOGGLE_CURRENT_PLAYER,
  MOVE_CHECKER,
} from "./actions";
import type { ActionTypes } from "./actions";
import { initialState } from "./state";

const reducer = (state = initialState, action: ActionTypes) => {
  switch (action.type) {
    case INCREMENT:
      return { ...state, count: state.count + 1 };

    case DECREMENT:
      return { ...state, count: state.count - 1 };

    case ROLL_DICE:
      const diceOne = Math.floor(Math.random() * 6) + 1;
      const diceTwo = Math.floor(Math.random() * 6) + 1;
      const bonusOne = diceOne === diceTwo ? diceOne : 0;
      const bonusTwo = diceOne === diceTwo ? diceOne : 0;
      if (diceOne === diceTwo) {
        return {
          ...state,
          dice: [diceOne, diceTwo, bonusOne, bonusTwo],
        };
      }
      return {
        ...state,
        dice: [diceOne, diceTwo],
      };

    case SWAP_DICE:
      if (state.dice?.length === 2) {
        return { ...state, dice: [state.dice[1], state.dice[0]] };
      }
      return { ...state };

    case SHIFT_DICE:
      switch (state.dice.length) {
        case 4:
          return {
            ...state,
            dice: [state.dice[1], state.dice[2], state.dice[2]],
          };
        case 3:
          return { ...state, dice: [state.dice[1], state.dice[2]] };
        case 2:
          return { ...state, dice: [state.dice[1]] };
        default:
          return { ...state, dice: [] };
      }

    case UPDATE_SCORE:
      const player = action.currentPlayer;
      const updatedScore =
        player === "playerOne"
          ? state.scores.playerOne + 1
          : state.scores.playerTwo + 1;
      return { ...state, scores: { ...state.scores, [player]: updatedScore } };

    case SET_CURRENT_PLAYER:
      return { ...state, currentPlayer: action.currentPlayer };

    case TOGGLE_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayer:
          state.currentPlayer === "playerOne" ? "playerTwo" : "playerOne",
      };

    case MOVE_CHECKER:
      return state;

    default:
      return state;
  }
};

export default reducer;
