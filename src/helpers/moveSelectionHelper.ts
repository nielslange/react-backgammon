/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { setNotice, setPreview } from '../data/actions';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import type { CheckerType, StateType } from '../types';
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
 * The die that a checker click will use: the explicitly selected die if it
 * is still available, otherwise the only playable die, otherwise none.
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
 * Handle a click on a checker in the select-die → preview → confirm flow.
 *
 * - First click on a checker with a legal move stores a preview and
 *   highlights the landing point.
 * - Clicking the same checker again (with the same die) commits the move.
 * - Illegal moves show an error notice and clear any preview.
 */
export const handleCheckerSelection = (
	dispatch: Dispatch,
	state: StateType,
	{ id, player }: { id: number; player: PlayerType }
) => {
	const { checkers, currentPlayer, dice, selectedDie, preview, gameOver } =
		state;
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

	if ( ! resolved.ok ) {
		dispatch( setPreview( null ) );
		return reject( resolved.message );
	}

	const isConfirmation =
		preview !== null && preview.checkerId === id && preview.die === die;
	if ( isConfirmation ) {
		return commitMove(
			dispatch,
			resolved,
			currentPlayer,
			state.cube.value
		);
	}

	dispatch(
		setPreview( {
			checkerId: id,
			from: lane,
			to: resolved.targetLane,
			die,
		} )
	);
	dispatch(
		setNotice(
			createNotice( NoticeStatusType.INFO, MessageType.PREVIEW_MOVE )
		)
	);
};

/**
 * Commit the previewed move, e.g. when the highlighted landing point is
 * clicked. No-op without a preview.
 */
export const confirmPreview = ( dispatch: Dispatch, state: StateType ) => {
	const { preview, checkers, currentPlayer, dice, gameOver } = state;
	if ( preview === null || currentPlayer === null ) return;
	const checker = checkers.find( ( c ) => c.id === preview.checkerId );
	if ( ! checker ) return;

	const resolved = resolveMove( {
		id: checker.id,
		player: checker.player,
		dice,
		currentPlayer,
		checkers,
		die: preview.die,
		lane: checker.lane,
		gameOver,
	} );
	if ( ! resolved.ok ) dispatch( setPreview( null ) );
	commitMove( dispatch, resolved, currentPlayer, state.cube.value );
};
