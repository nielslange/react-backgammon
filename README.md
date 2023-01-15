# 🎲 React Backgammon

React implementation of Backgammon.

## Rules

- The game has two players: white and black.
- Each player has 15 checkers.
- The board is a regular backgammon board.
- All checkers are are placed in the initial position (see below).
- The game uses two dice.
- A single checker in a row is unprotected and can be thrown out by the competitor.
- Two or more checker in a row are protected and blocking this row for the competitor.
- A checker that had been thrown out by the competitor must be brought in before making other moves.

## Initial position

![initial-position](https://user-images.githubusercontent.com/3323310/131032082-7167a1de-bf4d-4b20-a94e-88b677642aa5.png)

## Checker states

- Progress: The checker is currently on the board.
- Thrown: The checker had been thrown out of the game and must be brought back into the game before any other move.
- Finished: The checker had been cleared from the board by the player.
