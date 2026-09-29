/**
 * Internal dependencies
 */
import { setNotice } from '../data/actions';
import {
	hasDiceBeenRolled,
	isCurrentPlayer,
	hasWaitingChecker,
	isCheckerClearedOff,
	isTargetOccupiedByOtherPlayer,
	willHitOpponent,
	getTargetLane,
	getHitCheckerId,
	hasCheckersOutsideHomeBoard,
	wouldClearOffChecker,
} from '../data/selectors';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import type { CheckerType } from '../types';
import { checkForWin } from './checkForWinHelper';
import { createNotice } from './createNoticeHelper';
import { updateGame } from './updateGameHelper';
import {
	findPlayableDiceSequence,
	validateDiceUse,
} from './validateMoveHelper';

/**
 * Handles the click event on a game board lane.
 *
 * @param event - The click event object.
 * @param id - The ID of the clicked lane.
 * @param player - The player object.
 * @param dice - The array of dice values.
 * @param currentPlayer - The current player.
 * @param checkers - The array of checkers on the board.
 * @param die - The current die value.
 * @param dispatch - The dispatch function for updating the game state.
 * @param gameOver - Whether the game has already ended (no moves allowed).
 * @param cubeValue - The doubling cube value used to multiply the win points.
 */
export const handleClick = (
	event: any,
	{
		id,
		player,
		dice,
		currentPlayer,
		checkers,
		die,
		dispatch,
		gameOver = false,
		cubeValue = 1,
	}: any
) => {
	const lane = parseInt( event.target.closest( '.lane' ).dataset.lane );
	const targetLane = getTargetLane( { currentPlayer, lane, die } );
	const newCheckers: CheckerType[] = JSON.parse( JSON.stringify( checkers ) );
	const newDice: number[] = [ ...dice ];
	const playerObject = { checkers, currentPlayer, lane, die };

	const reject = ( message: MessageType ) =>
		dispatch(
			setNotice( createNotice( NoticeStatusType.ERROR, message ) )
		);

	if ( gameOver ) {
		return reject( MessageType.GAME_OVER );
	}

	if ( ! hasDiceBeenRolled( dice ) ) {
		return reject( MessageType.ROLL_DICE_FIRST );
	}

	if ( ! isCurrentPlayer( { player, currentPlayer } ) ) {
		return reject( MessageType.NOT_YOUR_CHECKER );
	}

	if ( ! validateDiceUse( { dice, checkers, currentPlayer, die } ) ) {
		return reject( MessageType.MUST_USE_LARGER_DIE );
	}

	if ( isCheckerClearedOff( { lane, currentPlayer } ) ) {
		return reject( MessageType.FINISHED_CHECKER );
	}

	// If player has a checker on the bar, they must move it first
	if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
		// If trying to move a checker that's not on the bar
		if ( lane !== 0 && lane !== 25 ) {
			return reject( MessageType.WAITING_CHECKER );
		}
	}

	if ( isTargetOccupiedByOtherPlayer( playerObject ) ) {
		return reject( MessageType.TARGET_OCCUPIED_BY_OPPONENT );
	}

	/**
	 * Apply the move to the working copies, enforce the "play as many dice
	 * as possible" rule, then commit the move to the store.
	 */
	const indexOfChecker = ( checkerId: number ) => {
		const index = newCheckers.findIndex( ( c ) => c.id === checkerId );
		if ( index === -1 ) {
			throw new Error( `Checker ${ checkerId } not found` );
		}
		return index;
	};

	const commitMove = ( message: MessageType ) => {
		newCheckers[ indexOfChecker( id ) ].lane = targetLane;
		newDice.shift();

		// A move is only legal if it still allows the maximum number of dice
		// to be played this turn. `validateDiceUse` already guards the die
		// choice; this guards the checker choice for that die.
		const maxBefore = findPlayableDiceSequence(
			checkers,
			currentPlayer,
			dice
		).length;
		const maxAfter = findPlayableDiceSequence(
			newCheckers,
			currentPlayer,
			newDice
		).length;
		if ( maxAfter + 1 < maxBefore ) {
			return reject( MessageType.MUST_PLAY_MAX_DICE );
		}

		const notice = createNotice( NoticeStatusType.SUCCESS, message );
		updateGame( dispatch, newCheckers, newDice, notice, currentPlayer );
		checkForWin( dispatch, newCheckers, currentPlayer, cubeValue );
	};

	const hitOpponent = () => {
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );

		if ( hitCheckerId === undefined ) {
			throw new Error( 'No checker found on target lane' );
		}

		newCheckers[ indexOfChecker( hitCheckerId ) ].lane =
			currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
	};

	if (
		hasWaitingChecker( { checkers, currentPlayer } ) &&
		willHitOpponent( { checkers, currentPlayer, lane, die } )
	) {
		hitOpponent();
		return commitMove( MessageType.MOVE_WAITING_CHECKER_AND_HIT );
	}

	if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
		return commitMove( MessageType.MOVE_CHECKER_TO_BOARD );
	}

	if ( willHitOpponent( { checkers, currentPlayer, lane, die } ) ) {
		hitOpponent();
		return commitMove( MessageType.MOVE_CHECKER_AND_HIT );
	}

	// Check if attempting to bear off when checkers are outside home board.
	// Bearing off is only allowed when ALL checkers are in the home board.
	// P1's borne-off lane is 25, P2's is 0. (Lanes 0/25 are also the bars,
	// but the bar is the *source* of moves, never the target.)
	const isBearingOff =
		( currentPlayer === PlayerType.PLAYER_ONE && targetLane === 25 ) ||
		( currentPlayer === PlayerType.PLAYER_TWO && targetLane === 0 );

	if (
		isBearingOff &&
		hasCheckersOutsideHomeBoard( { checkers, currentPlayer } )
	) {
		return reject( MessageType.NOT_ALL_CHECKERS_IN_END_ZONE );
	}

	// Check if attempting to bear off with higher die when checkers exist on higher points
	// This only applies when all checkers are in the home board
	if (
		isBearingOff &&
		! hasCheckersOutsideHomeBoard( { checkers, currentPlayer } ) &&
		! wouldClearOffChecker( { die, lane, currentPlayer, checkers } )
	) {
		// Attempting to bear off but wouldClearOffChecker returned false
		// This means either not exact and checkers exist on higher points, or invalid move
		return reject( MessageType.NOT_ALL_CHECKERS_IN_END_ZONE );
	}

	return commitMove( MessageType.MOVE_CHECKER );
};
