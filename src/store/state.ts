interface Checker {
  id: number;
  player: string;
  row: number;
  state: string;
}

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
  checkers: {
    one: Checker;
    two: Checker;
    three: Checker;
    four: Checker;
    five: Checker;
    six: Checker;
    seven: Checker;
    eight: Checker;
    nine: Checker;
    ten: Checker;
    eleven: Checker;
    twelve: Checker;
    thirteen: Checker;
    fourteen: Checker;
    fifteen: Checker;
    sixteen: Checker;
    seventeen: Checker;
    eighteen: Checker;
    nineteen: Checker;
    twenty: Checker;
    twentyOne: Checker;
    twentyTwo: Checker;
    twentyThree: Checker;
    twentyFour: Checker;
    twentyFive: Checker;
    twentySix: Checker;
    twentySeven: Checker;
    twentyEight: Checker;
    twentyNine: Checker;
    thirty: Checker;
  };
}
