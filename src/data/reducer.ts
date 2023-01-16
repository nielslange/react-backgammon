import { initialState } from "./state";
import TYPES from "./action-types";

const reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case TYPES.INCREMENT:
      return { ...state, count: state.count + 1 };

    case TYPES.DECREMENT:
      return { ...state, count: state.count - 1 };

    case TYPES.ROLL_DICE:
      return { ...state, dice: [...action.dice] };

    case TYPES.SWAP_DICE:
      return { ...state, dice: [...action.dice] };

    case TYPES.SHIFT_DICE:
      return { ...state, dice: [...action.dice] };

    case TYPES.UPDATE_SCORE:
      const player = action.currentPlayer;
      const updatedScore =
        player === "playerOne"
          ? state.scores.playerOne + 1
          : state.scores.playerTwo + 1;
      return { ...state, scores: { ...state.scores, [player]: updatedScore } };

    case TYPES.SET_CURRENT_PLAYER:
      return { ...state, currentPlayer: action.currentPlayer };

    case TYPES.TOGGLE_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayer:
          state.currentPlayer === "playerOne" ? "playerTwo" : "playerOne",
      };

    case TYPES.MOVE_CHECKER:
      return state;

    default:
      return state;
  }
};

export default reducer;
