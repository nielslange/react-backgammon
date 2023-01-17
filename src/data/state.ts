type Player = "PLAYER_ONE" | "PLAYER_TWO";

export interface CheckerProps {
  id: number;
  player: Player;
  row: number;
  state: "PROGRESS" | "THROWN" | "BEAR_OFF";
}

interface State {
  count: number;
  dice: number[];
  currentPlayer: Player;
  scores: {
    PLAYER_ONE: number;
    PLAYER_TWO: number;
  };
  checkers: CheckerProps[];
}

export const initialState: State = {
  count: 0,
  dice: [],
  currentPlayer: "PLAYER_ONE",
  scores: {
    PLAYER_ONE: 0,
    PLAYER_TWO: 0,
  },
  checkers: [
    { id: 1, player: "PLAYER_ONE", row: 1, state: "PROGRESS" },
    { id: 2, player: "PLAYER_ONE", row: 1, state: "PROGRESS" },
    { id: 3, player: "PLAYER_ONE", row: 12, state: "PROGRESS" },
    { id: 4, player: "PLAYER_ONE", row: 12, state: "PROGRESS" },
    { id: 5, player: "PLAYER_ONE", row: 12, state: "PROGRESS" },
    { id: 6, player: "PLAYER_ONE", row: 12, state: "PROGRESS" },
    { id: 7, player: "PLAYER_ONE", row: 12, state: "PROGRESS" },
    { id: 8, player: "PLAYER_ONE", row: 17, state: "PROGRESS" },
    { id: 9, player: "PLAYER_ONE", row: 17, state: "PROGRESS" },
    { id: 10, player: "PLAYER_ONE", row: 17, state: "PROGRESS" },
    { id: 11, player: "PLAYER_ONE", row: 19, state: "PROGRESS" },
    { id: 12, player: "PLAYER_ONE", row: 19, state: "PROGRESS" },
    { id: 13, player: "PLAYER_ONE", row: 19, state: "PROGRESS" },
    { id: 14, player: "PLAYER_ONE", row: 19, state: "PROGRESS" },
    { id: 15, player: "PLAYER_ONE", row: 19, state: "PROGRESS" },
    { id: 16, player: "PLAYER_TWO", row: 24, state: "PROGRESS" },
    { id: 17, player: "PLAYER_TWO", row: 24, state: "PROGRESS" },
    { id: 18, player: "PLAYER_TWO", row: 13, state: "PROGRESS" },
    { id: 19, player: "PLAYER_TWO", row: 13, state: "PROGRESS" },
    { id: 20, player: "PLAYER_TWO", row: 13, state: "PROGRESS" },
    { id: 21, player: "PLAYER_TWO", row: 13, state: "PROGRESS" },
    { id: 22, player: "PLAYER_TWO", row: 13, state: "PROGRESS" },
    { id: 23, player: "PLAYER_TWO", row: 8, state: "PROGRESS" },
    { id: 24, player: "PLAYER_TWO", row: 8, state: "PROGRESS" },
    { id: 25, player: "PLAYER_TWO", row: 8, state: "PROGRESS" },
    { id: 26, player: "PLAYER_TWO", row: 6, state: "PROGRESS" },
    { id: 27, player: "PLAYER_TWO", row: 6, state: "PROGRESS" },
    { id: 28, player: "PLAYER_TWO", row: 6, state: "PROGRESS" },
    { id: 29, player: "PLAYER_TWO", row: 6, state: "PROGRESS" },
    { id: 30, player: "PLAYER_TWO", row: 6, state: "PROGRESS" },
  ],
};
