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

const initialState: State = {
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
  checkers: {
    one: { id: 1, player: "playerOne", row: 1, state: "active" },
    two: { id: 2, player: "playerOne", row: 1, state: "active" },
    three: { id: 3, player: "playerOne", row: 12, state: "active" },
    four: { id: 4, player: "playerOne", row: 12, state: "active" },
    five: { id: 5, player: "playerOne", row: 12, state: "active" },
    six: { id: 6, player: "playerOne", row: 12, state: "active" },
    seven: { id: 7, player: "playerOne", row: 12, state: "active" },
    eight: { id: 8, player: "playerOne", row: 17, state: "active" },
    nine: { id: 9, player: "playerOne", row: 17, state: "active" },
    ten: { id: 10, player: "playerOne", row: 17, state: "active" },
    eleven: { id: 11, player: "playerOne", row: 19, state: "active" },
    twelve: { id: 12, player: "playerOne", row: 19, state: "active" },
    thirteen: { id: 13, player: "playerOne", row: 19, state: "active" },
    fourteen: { id: 14, player: "playerOne", row: 19, state: "active" },
    fifteen: { id: 15, player: "playerOne", row: 19, state: "active" },
    sixteen: { id: 16, player: "playerTwo", row: 24, state: "active" },
    seventeen: { id: 17, player: "playerTwo", row: 24, state: "active" },
    eighteen: { id: 18, player: "playerTwo", row: 13, state: "active" },
    nineteen: { id: 19, player: "playerTwo", row: 13, state: "active" },
    twenty: { id: 20, player: "playerTwo", row: 13, state: "active" },
    twentyOne: { id: 21, player: "playerTwo", row: 13, state: "active" },
    twentyTwo: { id: 22, player: "playerTwo", row: 13, state: "active" },
    twentyThree: { id: 23, player: "playerTwo", row: 8, state: "active" },
    twentyFour: { id: 24, player: "playerTwo", row: 8, state: "active" },
    twentyFive: { id: 25, player: "playerTwo", row: 8, state: "active" },
    twentySix: { id: 26, player: "playerTwo", row: 6, state: "active" },
    twentySeven: { id: 27, player: "playerTwo", row: 6, state: "active" },
    twentyEight: { id: 28, player: "playerTwo", row: 6, state: "active" },
    twentyNine: { id: 29, player: "playerTwo", row: 6, state: "active" },
    thirty: { id: 30, player: "playerTwo", row: 6, state: "active" },
  },
};

const reducer = (state = initialState, action: Action) => {
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
