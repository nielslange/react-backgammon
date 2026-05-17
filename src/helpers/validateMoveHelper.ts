/**
 * Internal dependencies
 */
import { PlayerType } from '../types';
import {
	hasWaitingChecker,
	getTargetLane,
	hasCheckersOutsideHomeBoard,
	wouldClearOffChecker,
} from '../data/selectors';

interface Checker {
	id: number;
	lane: number;
	player: PlayerType;
}

/**
 * Returns the legal target lane for moving a checker on `lane` with `die`,
 * or null if the move is illegal in the current position.
 */
const tryMove = (
	checkers: Checker[],
	currentPlayer: PlayerType,
	lane: number,
	die: number
): number | null => {
	// If we're on the bar, we may only move the bar checker.
	const onBar = hasWaitingChecker( { checkers, currentPlayer } );
	const barLane = currentPlayer === PlayerType.PLAYER_ONE ? 0 : 25;
	if ( onBar && lane !== barLane ) return null;

	const target = getTargetLane( { currentPlayer, die, lane } );

	const isBearingOff =
		( currentPlayer === PlayerType.PLAYER_ONE && target === 25 ) ||
		( currentPlayer === PlayerType.PLAYER_TWO && target === 0 );

	if ( isBearingOff ) {
		// Bear-off requires all checkers in home board.
		if ( hasCheckersOutsideHomeBoard( { checkers, currentPlayer } ) ) {
			return null;
		}
		// And the source must satisfy exact / overshoot rules.
		if (
			! wouldClearOffChecker( {
				die,
				lane,
				currentPlayer,
				checkers,
			} )
		) {
			return null;
		}
		return target;
	}

	// Off-board target without bearing-off eligibility = invalid.
	if ( target < 1 || target > 24 ) return null;

	// Blocked by 2+ opponent checkers?
	const opponents = checkers.filter(
		( c ) => c.player !== currentPlayer && c.lane === target
	).length;
	if ( opponents >= 2 ) return null;

	return target;
};

/**
 * Apply a move and return the new checker array.
 * The first matching checker on `lane` is moved; if it lands on a single
 * opponent checker, the opponent is sent to the bar.
 */
const applyMove = (
	checkers: Checker[],
	currentPlayer: PlayerType,
	lane: number,
	target: number
): Checker[] => {
	const opponentBar = currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
	const moverIndex = checkers.findIndex(
		( c ) => c.player === currentPlayer && c.lane === lane
	);
	if ( moverIndex === -1 ) return checkers;

	const next = checkers.map( ( c ) => ( { ...c } ) );

	// Hit single opponent checker on the target.
	const opponentsOnTarget = next.filter(
		( c ) => c.player !== currentPlayer && c.lane === target
	);
	if ( opponentsOnTarget.length === 1 ) {
		opponentsOnTarget[ 0 ].lane = opponentBar;
	}

	next[ moverIndex ].lane = target;
	return next;
};

/**
 * Recursively find the longest playable dice sequence.
 *
 * Returns an array of die values that can be played in order. Length equals
 * `dice.length` only if a full sequence exists.
 */
export const findPlayableDiceSequence = (
	checkers: Checker[],
	currentPlayer: PlayerType,
	dice: number[]
): number[] => {
	if ( dice.length === 0 ) return [];

	let best: number[] = [];

	// Try each unique die value first (avoid redundant search on doubles).
	const triedDice = new Set< number >();
	for ( let i = 0; i < dice.length; i++ ) {
		const die = dice[ i ];
		if ( triedDice.has( die ) ) continue;
		triedDice.add( die );

		// Try moving each checker that could use this die.
		for ( const checker of checkers ) {
			if ( checker.player !== currentPlayer ) continue;
			const borneOffLane =
				currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
			if ( checker.lane === borneOffLane ) continue;

			const target = tryMove(
				checkers,
				currentPlayer,
				checker.lane,
				die
			);
			if ( target === null ) continue;

			const remainingDice = [
				...dice.slice( 0, i ),
				...dice.slice( i + 1 ),
			];
			const nextCheckers = applyMove(
				checkers,
				currentPlayer,
				checker.lane,
				target
			);
			const subSequence = findPlayableDiceSequence(
				nextCheckers,
				currentPlayer,
				remainingDice
			);

			const candidate = [ die, ...subSequence ];
			if ( candidate.length > best.length ) {
				best = candidate;
				if ( best.length === dice.length ) return best;
			}
		}
	}

	return best;
};

/**
 * Counts opponent checkers on a specific lane.
 */
const countOpponentsOnLane = (
	checkers: Checker[],
	currentPlayer: PlayerType,
	lane: number
): number =>
	checkers.reduce(
		( count, c ) =>
			c.lane === lane && c.player !== currentPlayer ? count + 1 : count,
		0
	);

/**
 * Validates if using the current die is allowed according to backgammon rules.
 *
 * Rules enforced:
 * 1. If both dice can be used together (any sequence), the player must use
 *    both. So if you start by playing the smaller die in a way that prevents
 *    the larger die from being playable next, that's illegal — but for the
 *    common case where both choices preserve a sequence, both are allowed.
 * 2. If only one of the two dice can be played at all, it must be the higher.
 * 3. Doubles: any die is valid.
 *
 * @returns true if the player is allowed to play this die now.
 */
export const validateDiceUse = ( {
	dice,
	checkers,
	currentPlayer,
	die,
}: {
	dice: number[];
	checkers: Checker[];
	currentPlayer: PlayerType;
	die: number;
} ): boolean => {
	if ( dice.length === 1 ) return true;
	if ( dice.length !== 2 || dice[ 0 ] === dice[ 1 ] ) return true;

	const smallerDie = Math.min( ...dice );
	const largerDie = Math.max( ...dice );

	const canUseSmaller = canUseDie( smallerDie, checkers, currentPlayer );
	const canUseLarger = canUseDie( largerDie, checkers, currentPlayer );

	// Rule 2: only one playable in isolation → it must be the higher.
	if ( canUseLarger && ! canUseSmaller ) {
		return die === largerDie;
	}
	if ( ! canUseLarger && canUseSmaller ) {
		return die === smallerDie;
	}
	if ( ! canUseLarger && ! canUseSmaller ) {
		// No playable die at all — caller should forfeit. Allow whatever they
		// pick; the click handler will produce no legal move anyway.
		return true;
	}

	// Both individually playable. Rule 1: prefer a die whose play preserves
	// the ability to play the other.
	const fullSequence = findPlayableDiceSequence( checkers, currentPlayer, [
		smallerDie,
		largerDie,
	] );
	if ( fullSequence.length === 2 ) {
		// Some ordering uses both. Forbid an opening play that has no
		// continuation — i.e., reject `die` only if every move of `die`
		// leaves the opposite die unplayable. We check: does any move of
		// `die` leave the opposite die playable next?
		const otherDie = die === largerDie ? smallerDie : largerDie;
		const hasContinuation = checkers.some( ( c ) => {
			if ( c.player !== currentPlayer ) return false;
			const target = tryMove( checkers, currentPlayer, c.lane, die );
			if ( target === null ) return false;
			const next = applyMove( checkers, currentPlayer, c.lane, target );
			return canUseDie( otherDie, next, currentPlayer );
		} );
		return hasContinuation;
	}

	// No full 2-die sequence (e.g., one die uses up the only checker that
	// could move). Higher must be used per Rule 2.
	return die === largerDie;
};

/**
 * Checks if a player has at least one valid move using the given die.
 * Considers bar re-entry priority, blocking by opponent, bearing-off eligibility.
 */
export const canUseDie = (
	die: number,
	checkers: Checker[],
	currentPlayer: PlayerType
): boolean => {
	// Bar re-entry takes priority. If any checker is on the bar,
	// only the entry point matters.
	if ( hasWaitingChecker( { checkers, currentPlayer } ) ) {
		const entryLane =
			currentPlayer === PlayerType.PLAYER_ONE ? 25 - die : die;
		return countOpponentsOnLane( checkers, currentPlayer, entryLane ) < 2;
	}

	return checkers.some( ( checker ) => {
		if ( checker.player !== currentPlayer ) return false;

		// Skip borne-off checkers.
		const borneOffLane =
			currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
		if ( checker.lane === borneOffLane ) return false;

		const targetLane = getTargetLane( {
			currentPlayer,
			die,
			lane: checker.lane,
		} );

		// Bearing off only allowed when this checker is in the home board.
		// getTargetLane collapses any move "off the end" to P1's off (25) or
		// P2's off (0), so we additionally require the source lane is in home.
		const isBearingOff =
			( currentPlayer === PlayerType.PLAYER_ONE && targetLane === 25 ) ||
			( currentPlayer === PlayerType.PLAYER_TWO && targetLane === 0 );
		if ( isBearingOff ) {
			const inHomeBoard =
				currentPlayer === PlayerType.PLAYER_ONE
					? checker.lane >= 1 && checker.lane <= 6
					: checker.lane >= 19 && checker.lane <= 24;
			if ( ! inHomeBoard ) return false;
			// Bearing-off destination is never blocked.
			return true;
		}

		// Normal move: blocked if 2+ opponent checkers on the target.
		return countOpponentsOnLane( checkers, currentPlayer, targetLane ) < 2;
	} );
};
