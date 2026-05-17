# 🎲 React Backgammon

React implementation of Backgammon.

## Basic rules

- The objective of the game is to move all of your pieces off the board before your opponent does.
- The game is played on a board with 24 triangular points, or "points," arranged in four quadrants.
- Each player starts with 15 pieces, or "checkers," of their own color, on the board in specific starting positions.
- Players take turns rolling two dice and moving their pieces according to the numbers rolled. The numbers on the dice must be used together, and a piece can only be moved to an open point.
- A player can move a piece to a point occupied by one of their own pieces, called a "blot," which can then be hit by an opponent's piece. If a player's blot is hit, the piece is placed on the bar and must re-enter the board on the opponent's home board before continuing to move.
- If a player rolls doubles, they can move four times the number rolled for each piece.
- A player can "bear off," or remove, their pieces from the board once they have moved all of their pieces to their home board.
- If a player cannot make a legal move, they forfeit their turn.
- The game can be played with a doubling cube, which allows a player to increase the stakes of the game by offering to double the current stakes.
- The first player to bear off all of their pieces wins the game, and the value of the stakes is awarded to the winner.

## Additional rules

- **Compulsory use of both dice**: If both dice can be played in some order, the player must play both. If only one of the two can be played, it must be the higher.
- **Bar precedence**: A player with a checker on the bar must re-enter it before making any other move. Re-entry uses the opponent's home board (die N → opponent's N-point).
- **Stacking**: A player can stack any number of their own checkers on a single point — there is no maximum.
- **Bearing off** is allowed only when all 15 of the player's checkers are in their home board (no checker on the bar). Exact rolls bear off from point N; overshoot rolls bear off from the highest occupied point only when no checker exists on a higher point.
- **Hit during bear-off** sends the checker to the bar; the player must re-enter and bring it back into the home board before resuming bear-off.
- **Win values**: 1 point for a single, 2 for a gammon (loser borne off zero), 3 for a backgammon (loser borne off zero AND has a checker on the bar OR in the winner's home board), all multiplied by the doubling cube's value.
- **Doubling cube**: Either player may offer to double when they own the cube or it's centered. The opponent accepts (cube doubles, ownership transfers) or drops (forfeits the current pre-double stake).
- **Match play**: Games accumulate to a target score (default 1; configurable to e.g. 5, 7, 11). The Crawford rule suppresses doubling in the game directly after either player first reaches `target − 1`; doubling resumes thereafter.
- **No legal moves**: If no playable dice sequence exists, the turn is forfeited.

## Initial position

![initial-position](https://user-images.githubusercontent.com/3323310/131032082-7167a1de-bf4d-4b20-a94e-88b677642aa5.png)

## Checker states

- PROGRESS: Indicates that the game is in progress and players are actively making moves.
- WAITING: Indicates that the dice have been rolled and the results have been determined.
- BEAR_OFF: Indicates that a player is in the process of bearing off, or removing, their pieces from the board.

## Actions types

- ROLL_DICE: This action type would be used when the dice are rolled.
- FLIP_DICE: Allows the player to flip the positions of the two dice after they have been rolled.
- SET_DICE: Allows the player to set the dice to a specific value.
- TOGGLE_CURRENT_PLAYER: Allows the game to switch the current player from one player to another, typically after a move has been made.
- MOVE_CHECKER: This action type would be used when a piece is moved to or on the board.
- UNDO_MOVE: This action type would be used when the player wants to undo the last move.
- REDO_MOVE: Reverses the previous move and allows the player to make a different move.
- SURRENDER_GAME: This action type would be used when the player wants to surrender the game.
- RESTART_GAME: Begins a new game with the same players and settings as the previous game.
- SAVE_GAME: This action type would be used when the player wants to save the current game state.
- LOAD_GAME: This action type would be used when the player wants to load a previously saved game state.
- SHOW_GAME_HISTORY: This action type would be used when the player wants to see the history of moves that have been made in the game.
- SHOW_GAME_STATISTICS: This action type would be used when the player wants to see statistics such as the number of moves made, the number of pieces hit, etc.
- SHOW_PLAYER_STATISTICS: Provides information about a player's performance in past games, such as win-loss record and average score.
- SHOW_PIP_COUNT: Displays the number of points (also known as "pips") that each player has accumulated on the board.
- UPDATE_PIP_COUNT: Allows the game to update the pip count for each player, typically after a move has been made or a piece has been borne off.
- OFFER_DOUBLING_CUBE: A cube with the numbers 2, 4, 8, 16, 32, and 64 on its faces. It is used in the game of Backgammon to increase the stakes of the game. A player can offer to double the .stakes of the game by turning the cube to the next number and presenting it to their opponent. If the opponent accepts, the cube is placed on the board with the number facing up, indicating the new stakes of the game. If the opponent declines, they forfeit the game.