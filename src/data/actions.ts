import TYPES from "./action-types";

export const increment = () => {
  return { type: TYPES.INCREMENT };
};

export const decrement = () => {
  return { type: TYPES.DECREMENT };
};

export const rollDice = (dice: number[]) => {
  return { type: TYPES.ROLL_DICE, dice };
};

export const swapDice = (dice: number[]) => {
  return { type: TYPES.SWAP_DICE, dice };
};

export const shiftDice = (dice: number[]) => {
  return { type: TYPES.SHIFT_DICE, dice };
};

export const updateScore = (currentPlayer: string, score: number) => {
  return { type: TYPES.UPDATE_SCORE, currentPlayer, score };
};

export const setCurrentPlayer = (currentPlayer: string) => {
  return { type: TYPES.SET_CURRENT_PLAYER, currentPlayer };
};

export const toggleCurrentPlayer = () => {
  return { type: TYPES.TOGGLE_CURRENT_PLAYER };
};

export const moveChecker = ({ player, id }: { player: string; id: number }) => {
  return { type: TYPES.MOVE_CHECKER, player, id };
};
