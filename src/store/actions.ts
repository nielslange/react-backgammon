export type Action =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" }
  | { type: "ROLL_DICE" }
  | {
      type: "UPDATE_SCORE";
      currentPlayer: string;
      score: number;
    }
  | {
      type: "SET_CURRENT_PLAYER";
      currentPlayer: string;
    }
  | {
      type: "TOGGLE_CURRENT_PLAYER";
    };

export const INCREMENT = "INCREMENT";
export const DECREMENT = "DECREMENT";
export const ROLL_DICE = "ROLL_DICE";
export const UPDATE_SCORE = "UPDATE_SCORE";
export const SET_CURRENT_PLAYER = "SET_CURRENT_PLAYER";
export const TOGGLE_CURRENT_PLAYER = "TOGGLE_CURRENT_PLAYER";

export const increment = () => {
  return { type: INCREMENT };
};

export const decrement = () => {
  return { type: DECREMENT };
};

export const rollDice = () => {
  return { type: "ROLL_DICE" };
};

export const updateScore = (currentPlayer: string, score: number) => {
  return { type: "UPDATE_SCORE", currentPlayer, score };
};

export const setCurrentPlayer = (currentPlayer: string) => {
  return { type: "SET_CURRENT_PLAYER", currentPlayer };
};

export const toggleCurrentPlayer = () => {
  return { type: "TOGGLE_CURRENT_PLAYER" };
};
