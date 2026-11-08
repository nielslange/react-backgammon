/**
 * Click handling on top of the engine's legal steps.
 *
 * Beginner mode: click a checker, its landing points light up, click one.
 * Advanced mode: pick a die, then a checker click moves at once.
 *
 * The engine decides what is legal; this module only turns clicks into
 * `playStep` dispatches and explains refusals with a hint.
 */
import type { AppDispatch, RootState } from '../data/createStore';
import { playStep } from '../data/gameSlice';
import { selectLegalSteps, selectPlayableDice } from '../data/selectors';
import { setHint, setPreview } from '../data/uiSlice';
import { getEngine } from '../engine';
import { isOnBoard } from '../engine/constants';
import type { Checker, Step } from '../engine/types';
import { MessageType, NoticeStatusType } from '../types';

const checkerById = ( root: RootState, id: number ): Checker | undefined =>
	root.game.state.checkers.find( ( c ) => c.id === id );

/** Legal steps of one checker, larger die first. */
export const optionsForChecker = ( root: RootState, checkerId: number ): Step[] => {
	const game = root.game.state;
	const checker = checkerById( root, checkerId );
	if ( ! checker || game.phase !== 'moving' || checker.player !== game.player ) {
		return [];
	}
	return selectLegalSteps( root )
		.filter( ( s ) => s.from === checker.lane )
		.sort( ( a, b ) => b.die - a.die );
};

/** Distinct die values that have a legal step right now, larger first. */
export const playableDice = ( root: RootState ): number[] => selectPlayableDice( root );

/** Advanced mode: the selected die if playable, else the only playable die. */
export const effectiveDie = ( root: RootState ): number | null => {
	const dice = playableDice( root );
	const selected = root.ui.selectedDie;
	if ( selected !== null && dice.includes( selected ) ) return selected;
	return dice.length === 1 ? dice[ 0 ] : null;
};

/** Why a checker cannot move right now. */
const rejectionFor = ( root: RootState, checkerId: number ): MessageType => {
	const game = root.game.state;
	const checker = checkerById( root, checkerId );
	if ( game.phase === 'over' ) return MessageType.GAME_OVER;
	if ( game.phase !== 'moving' || game.player === null ) {
		return MessageType.ROLL_DICE_FIRST;
	}
	if ( ! checker || checker.player !== game.player ) {
		return MessageType.NOT_YOUR_CHECKER;
	}
	return getEngine( game.variant ).explainRefusal( game, checkerId ) ?? MessageType.NO_MOVE_FOR_CHECKER;
};

const hint = (
	dispatch: AppDispatch,
	message: MessageType,
	status: NoticeStatusType = NoticeStatusType.ERROR
) => dispatch( setHint( { message, status } ) );

/**
 * Move the previewed checker onto `lane` if it is one of its landing
 * points. Two dice reach the same point only when both bear off; the
 * smaller die is used so the larger stays available.
 */
const confirmPreview = ( dispatch: AppDispatch, root: RootState, lane: number ): boolean => {
	const preview = root.ui.preview;
	if ( ! preview ) return false;
	const option = preview.options
		.filter( ( o ) => o.to === lane )
		.sort( ( a, b ) => a.die - b.die )[ 0 ];
	if ( ! option ) return false;
	dispatch( playStep( { step: { ...option, checkerId: preview.checkerId } } ) );
	return true;
};

export const onTargetClick = ( dispatch: AppDispatch, root: RootState, lane: number ): void => {
	confirmPreview( dispatch, root, lane );
};

const beginnerClick = ( dispatch: AppDispatch, root: RootState, checkerId: number ) => {
	const game = root.game.state;
	const preview = root.ui.preview;
	const checker = checkerById( root, checkerId );

	if ( game.phase !== 'moving' ) {
		dispatch( setPreview( null ) );
		return hint( dispatch, rejectionFor( root, checkerId ) );
	}

	// A click on a checker that stands on a highlighted landing point (own
	// stack, own off tray, or the opponent's blot) means "move there".
	if ( preview && preview.checkerId !== checkerId && checker ) {
		const isLanding =
			preview.options.some( ( o ) => o.to === checker.lane ) &&
			( isOnBoard( checker.lane ) || checker.player === game.player );
		if ( isLanding && confirmPreview( dispatch, root, checker.lane ) ) return;
	}

	const options = optionsForChecker( root, checkerId );
	if ( options.length === 0 ) {
		dispatch( setPreview( null ) );
		return hint( dispatch, rejectionFor( root, checkerId ) );
	}
	if ( preview?.checkerId === checkerId && options.length === 1 ) {
		dispatch( playStep( { step: options[ 0 ] } ) );
		return;
	}
	dispatch( setPreview( { checkerId, options } ) );
	hint( dispatch, MessageType.PREVIEW_MOVE, NoticeStatusType.INFO );
};

const advancedClick = ( dispatch: AppDispatch, root: RootState, checkerId: number ) => {
	if ( root.game.state.phase !== 'moving' ) {
		return hint( dispatch, rejectionFor( root, checkerId ) );
	}
	const die = effectiveDie( root );
	if ( die === null ) return hint( dispatch, MessageType.SELECT_DIE_FIRST );
	const options = optionsForChecker( root, checkerId );
	const step = options.find( ( o ) => o.die === die );
	if ( ! step ) {
		return hint(
			dispatch,
			options.length ? MessageType.DIE_NOT_PLAYABLE : rejectionFor( root, checkerId )
		);
	}
	dispatch( playStep( { step } ) );
};

export const onCheckerClick = (
	dispatch: AppDispatch,
	root: RootState,
	checkerId: number
): void => {
	if ( root.ui.mode === 'advanced' ) {
		advancedClick( dispatch, root, checkerId );
	} else {
		beginnerClick( dispatch, root, checkerId );
	}
};

/**
 * A checker was dropped on `lane`: play the step that lands there, using
 * the smaller die when two do (bear-off). Returns whether a step was played.
 */
export const onDrop = (
	dispatch: AppDispatch,
	root: RootState,
	checkerId: number,
	lane: number
): boolean => {
	const step = optionsForChecker( root, checkerId )
		.filter( ( o ) => o.to === lane )
		.sort( ( a, b ) => a.die - b.die )[ 0 ];
	if ( ! step ) return false;
	dispatch( playStep( { step: { ...step, checkerId } } ) );
	return true;
};
