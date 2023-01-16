export interface CheckerProps {
  id: number;
  player: string;
  row: number;
  state: string;
}

export interface State {
  count: number;
  dice: number[];
  currentPlayer: string;
  scores: {
    playerOne: number;
    playerTwo: number;
  };
  checkers: CheckerProps[];
}

export const initialState: State = {
  count: 0,
  dice: [],
  currentPlayer: "playerOne",
  scores: {
    playerOne: 0,
    playerTwo: 0,
  },
  checkers: [
    { id: 1, player: "playerOne", row: 1, state: "active" },
    { id: 2, player: "playerOne", row: 1, state: "active" },
    { id: 3, player: "playerOne", row: 12, state: "active" },
    { id: 4, player: "playerOne", row: 12, state: "active" },
    { id: 5, player: "playerOne", row: 12, state: "active" },
    { id: 6, player: "playerOne", row: 12, state: "active" },
    { id: 7, player: "playerOne", row: 12, state: "active" },
    { id: 8, player: "playerOne", row: 17, state: "active" },
    { id: 9, player: "playerOne", row: 17, state: "active" },
    { id: 10, player: "playerOne", row: 17, state: "active" },
    { id: 11, player: "playerOne", row: 19, state: "active" },
    { id: 12, player: "playerOne", row: 19, state: "active" },
    { id: 13, player: "playerOne", row: 19, state: "active" },
    { id: 14, player: "playerOne", row: 19, state: "active" },
    { id: 15, player: "playerOne", row: 19, state: "active" },
    { id: 16, player: "playerTwo", row: 24, state: "active" },
    { id: 17, player: "playerTwo", row: 24, state: "active" },
    { id: 18, player: "playerTwo", row: 13, state: "active" },
    { id: 19, player: "playerTwo", row: 13, state: "active" },
    { id: 20, player: "playerTwo", row: 13, state: "active" },
    { id: 21, player: "playerTwo", row: 13, state: "active" },
    { id: 22, player: "playerTwo", row: 13, state: "active" },
    { id: 23, player: "playerTwo", row: 8, state: "active" },
    { id: 24, player: "playerTwo", row: 8, state: "active" },
    { id: 25, player: "playerTwo", row: 8, state: "active" },
    { id: 26, player: "playerTwo", row: 6, state: "active" },
    { id: 27, player: "playerTwo", row: 6, state: "active" },
    { id: 28, player: "playerTwo", row: 6, state: "active" },
    { id: 29, player: "playerTwo", row: 6, state: "active" },
    { id: 30, player: "playerTwo", row: 6, state: "active" },
  ],
};
