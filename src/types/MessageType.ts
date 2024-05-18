export enum MessageType {
	WELCOME = 'Welcome to Backgammon!',
	ROLL_DICE_FIRST = 'You need to roll the dice first!',
	NOT_YOUR_CHECKER = 'This is not your checker!',
	FINISHED_CHECKER = 'You cannot add a finished checker to the game!',
	WAITING_CHECKER = 'You need to add the waiting checker first!',
	OCCUPIED_BY_YOU = 'The target lane is occupied by your checkers!',
	OCCUPIED_BY_OPPONENT = "The target lane is occupied by your opponent's checkers!",
	MOVE_CHECKER = 'Move the checker to the target lane!',
	MOVE_CHECKER_AND_HIT = 'Move the checker to the target lane and hit the opponent!',
	MOVE_CHECKER_TO_GAME = 'Move the checker to the game board!',
	MOVE_WAITING_CHECKER_AND_HIT = "Move waiting checker to the game and hit your opponent's checker!",
}
