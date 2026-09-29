/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { setNotice, setPreview } from '../data/actions';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import type { CheckerType, MoveOption, StateType } from '../types';
import { createNotice } from './createNoticeHelper';
import { commitMove, resolveMove } from './handleClickHelper';
import { canUseDie, validateDiceUse } from './validateMoveHelper';

/**
 * The distinct die values the current player may play right now: a die
 * must have at least one legal move and must respect the larger-die rule.
 */
export const getPlayableDice = ( {
	dice,
	checkers,
	currentPlayer,
}: {
	dice: number[];
	checkers: CheckerType[];
	currentPlayer: PlayerType | null;
} ): number[] => {
	if ( currentPlayer === null ) return [];
	return [ ...new Set( dice ) ].filter(
		( die ) =>
			validateDiceUse( { dice, checkers, currentPlayer, die } ) &&
			canUseDie( die, checkers, currentPlayer )
	);
};

/**
 * Advanced mode: the die a checker click will use. The explicitly selected
 * die if it is still available, otherwise the only playable die, else none.
 */
export const getEffectiveDie = ( {
	dice,
	selectedDie,
	playableDice,
}: {
	dice: number[];
	selectedDie: number | null;
	playableDice: number[];
} ): number | null => {
	if ( selectedDie !== null && dice.includes( selectedDie ) ) {
		return selectedDie;
	}
	return playableDice.length === 1 ? playableDice[ 0 ] : null;
};

/**
 * Advanced mode: move the clicked checker immediately with the selected
 * die. No preview; illegal moves show why.
 */
export const handleDirectMove = (
	dispatch: Dispatch,
	state: StateType,
	{ id, player }: { id: number; player: PlayerType }
) => {
	const { checkers, currentPlayer, dice, selectedDie, gameOver } = state;
	const reject = ( message: MessageType ) =>
		dispatch(
			setNotice( createNotice( NoticeStatusType.ERROR, message ) )
		);

	if ( currentPlayer === null || dice.length === 0 ) {
		return reject( MessageType.ROLL_DICE_FIRST );
	}

	const playableDice = getPlayableDice( { dice, checkers, currentPlayer } );
	const die = getEffectiveDie( { dice, selectedDie, playableDice } );
	if ( die === null ) return reject( MessageType.SELECT_DIE_FIRST );

	const lane = checkers.find( ( c ) => c.id === id )?.lane;
	if ( lane === undefined ) return reject( MessageType.NOT_YOUR_CHECKER );

	const resolved = resolveMove( {
		id,
		player,
		dice,
		currentPlayer,
		checkers,
		die,
		lane,
		gameOver,
	} );
	return commitMove( dispatch, resolved, currentPlayer, state.cube.value );
};

/**
 * Every legal landing point of one checker with the remaining dice, one
 * entry per distinct die, plus the rejection reason if there is none.
 */
export const getMoveOptions = (
	state: Pick<
		StateType,
		'checkers' | 'currentPlayer' | 'dice' | 'gameOver'
	>,
	{ id, player }: { id: number; player: PlayerType }
): { options: MoveOption[]; rejection: MessageType | null } => {
	const { checkers, currentPlayer, dice, gameOver } = state;
	const lane = checkers.find( ( c ) => c.id === id )?.lane;
	if ( currentPlayer === null || lane === undefined ) {
		return { options: [], rejection: MessageType.NOT_YOUR_CHECKER };
	}

	const options: MoveOption[] = [];
	let rejection: MessageType | null = null;
	// Try the larger die first so its rejection reason wins when nothing
	// is playable (e.g. "must use the larger die").
	for ( const die of [ ...new Set( dice ) ].sort( ( a, b ) => b - a ) ) {
		const resolved = resolveMove( {
			id,
			player,
			dice,
			currentPlayer,
			checkers,
			die,
			lane,
			gameOver,
		} );
		if ( resolved.ok ) {
			options.push( { die, to: resolved.targetLane } );
		} else if ( rejection === null ) {
			rejection = resolved.message;
		}
	}

	return { options, rejection: options.length ? null : rejection };
};

/**
 * Handle a click on a checker in the click-checker → click-point flow.
 *
 * - A checker with legal moves becomes the preview: its landing points
 *   are highlighted, one per die.
 * - Clicking the previewed checker again moves it when it has exactly
 *   one landing point.
 * - A checker without legal moves shows why and clears any preview.
 */
export const handleCheckerSelection = (
	dispatch: Dispatch,
	state: StateType,
	{ id, player }: { id: number; player: PlayerType }
) => {
	const { checkers, currentPlayer, dice, preview } = state;
	const reject = ( message: MessageType ) => {
		dispatch( setPreview( null ) );
		return dispatch(
			setNotice( createNotice( NoticeStatusType.ERROR, message ) )
		);
	};

	if ( currentPlayer === null || dice.length === 0 ) {
		return reject( MessageType.ROLL_DICE_FIRST );
	}

	// Clicking a checker that stands on a highlighted landing point (own
	// stack, or the opponent's blot about to be hit) means "move there".
	if ( preview !== null && preview.checkerId !== id ) {
		const clickedLane = checkers.find( ( c ) => c.id === id )?.lane;
		const onBoard =
			clickedLane !== undefined && clickedLane >= 1 && clickedLane <= 24;
		const isLandingPoint =
			clickedLane !== undefined &&
			preview.options.some( ( o ) => o.to === clickedLane ) &&
			( onBoard || player === currentPlayer );
		if ( isLandingPoint ) {
			return confirmPreview( dispatch, state, clickedLane );
		}
	}

	const { options, rejection } = getMoveOptions( state, { id, player } );
	if ( ! options.length ) {
		return reject( rejection ?? MessageType.NO_MOVE_FOR_CHECKER );
	}

	if ( preview?.checkerId === id && options.length === 1 ) {
		return confirmPreview( dispatch, state, options[ 0 ].to );
	}

	const lane = checkers.find( ( c ) => c.id === id )!.lane;
	dispatch( setPreview( { checkerId: id, from: lane, options } ) );
	dispatch(
		setNotice(
			createNotice( NoticeStatusType.INFO, MessageType.PREVIEW_MOVE )
		)
	);
};

/**
 * Move the previewed checker to `to`, one of its highlighted landing
 * points. No-op if nothing is previewed or `to` is not an option.
 */
export const confirmPreview = (
	dispatch: Dispatch,
	state: StateType,
	to: number
) => {
	const { preview, checkers, currentPlayer, dice, gameOver } = state;
	if ( preview === null || currentPlayer === null ) return;
	const checker = checkers.find( ( c ) => c.id === preview.checkerId );
	if ( ! checker ) return;

	// Two dice can lead to the same point only when both bear off; use the
	// smaller die so the larger one stays available for another checker.
	const option = preview.options
		.filter( ( o ) => o.to === to )
		.sort( ( a, b ) => a.die - b.die )[ 0 ];
	if ( ! option ) return;

	const resolved = resolveMove( {
		id: checker.id,
		player: checker.player,
		dice,
		currentPlayer,
		checkers,
		die: option.die,
		lane: checker.lane,
		gameOver,
	} );
	if ( ! resolved.ok ) dispatch( setPreview( null ) );
	commitMove( dispatch, resolved, currentPlayer, state.cube.value );
};
