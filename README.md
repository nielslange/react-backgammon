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

- A player can use one die to move a piece if the other die is not a legal move.
- A player can move a piece to a point occupied by two or more of their own pieces, called a "stack," but the piece on top of the stack must be moved first.
- A player can only bear off a piece if all of their pieces are on their home board and all of the points in their home board are closed.
- A player can only hit a blot if the point being hit is open, or if the point being hit is occupied by a single opposing piece.
- A player can only hit an opponent's blot if the point being hit is open, or if the point being hit is occupied by a single opposing piece and the player has at least two pieces on the bar.
- A player can only hit an opponent's blot if the point being hit is open, or if the point being hit is occupied by a single opposing piece and the player has at least two pieces on the bar.
- A player can use the doubling cube to offer a gammon, which is worth twice the stakes of the game, or a backgammon, which is worth three times the stakes of the game.
- A player can only offer a gammon or backgammon if they have at least one piece on the opponent's home board or if the opponent has not borne off any pieces.
- A player can forfeit the game if they feel they have no chance of winning.
- A player can request to use a clock to limit the time for each move.

## Initial position

![initial-position](https://user-images.githubusercontent.com/3323310/131032082-7167a1de-bf4d-4b20-a94e-88b677642aa5.png)

## Checker states

- PROGRESS: Indicates that the game is in progress and players are actively making moves.
- THROWN: Indicates that the dice have been rolled and the results have been determined.
- BEAR_OFF: Indicates that a player is in the process of bearing off, or removing, their pieces from the board.

## Actions types

- ROLL_DICE: This action type would be used when the dice are rolled.
- SWAP_DICE: Allows the player to swap the positions of the two dice after they have been rolled.
- SHIFT_DICE: Allows the player to change the values of the two dice by a certain amount, such as adding or subtracting one.
- TOGGLE_CURRENT_PLAYER: Allows the game to switch the current player from one player to another, typically after a move has been made.
- MOVE_PIECE: This action type would be used when a piece is moved on the board.
- REMOVE_PIECE: This action type would be used when a piece is removed from the board.
- BEAR_OFF_PIECE: This action type would be used when a piece is borne off the board.
- UNDO_MOVE: This action type would be used when the player wants to undo the last move.
- REDO_MOVE: Reverses the previous move and allows the player to make a different move.
- SAVE_GAME: This action type would be used when the player wants to save the current game state.
- LOAD_GAME: This action type would be used when the player wants to load a previously saved game state.
- SURRENDER_GAME: This action type would be used when the player wants to surrender the game.
- SHOW_HISTORY: This action type would be used when the player wants to see the history of moves that have been made in the game.
- SHOW_STATISTICS: This action type would be used when the player wants to see statistics such as the number of moves made, the number of pieces hit, etc.
- ERROR: This action type would be used when an error occurs in the game.
- RESTART_GAME: Begins a new game with the same players and settings as the previous game.
- UPDATE_PIP_COUNT: Allows the game to update the pip count for each player, typically after a move has been made or a piece has been borne off.
- SHOW_PIP_COUNT: Displays the number of points (also known as "pips") that each player has accumulated on the board.
- SHOW_USER_STATISTICS: Provides information about a player's performance in past games, such as win-loss record and average score.
- OFFER_DOUBLING_CUBE: A cube with the numbers 2, 4, 8, 16, 32, and 64 on its faces. It is used in the game of Backgammon to increase the stakes of the game. A player can offer to double the .stakes of the game by turning the cube to the next number and presenting it to their opponent. If the opponent accepts, the cube is placed on the board with the number facing up, indicating the new stakes of the game. If the opponent declines, they forfeit the game.
