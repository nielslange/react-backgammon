export interface State {
  count: number;
  dice: {
    one: number;
    two: number;
  };
  bonus: {
    one: number;
    two: number;
  };
  currentPlayer: string;
  scores: {
    playerOne: number;
    playerTwo: number;
  };
}
