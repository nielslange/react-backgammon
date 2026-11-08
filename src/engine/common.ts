/**
 * Transitions shared by every variant.
 */
import { moveOne } from './backgammon/movement';
import { opponent } from './constants';
import { EngineError } from './errors';
import type { GameState, Step } from './types';

/** Hand the turn to the opponent, who must now roll. */
export const handOff = ( state: GameState, forfeited: boolean ): GameState => ( {
	...state,
	player: state.player === null ? null : opponent( state.player ),
	phase: 'awaiting-roll',
	roll: null,
	dice: [],
	turnSteps: [],
	rerolls: 0,
	lastEvent: forfeited ? 'forfeit' : 'hand-off',
} );

/**
 * Play `step` if a legal step with the same lane and die exists: move the
 * checker, consume that die, record the step for undo.
 */
export const applyLegalStep = ( state: GameState, step: Step, legal: Step[] ): GameState => {
	if ( state.player === null ) throw new EngineError( 'NOT_YOUR_TURN' );
	const match = legal.find( ( s ) => s.from === step.from && s.die === step.die );
	if ( ! match ) throw new EngineError( 'ILLEGAL_STEP' );
	const { checkers, hit, moverId } = moveOne(
		state.checkers,
		state.player,
		step.checkerId,
		match.from,
		match.to
	);
	const dice = [ ...state.dice ];
	dice.splice( dice.indexOf( step.die ), 1 );
	return {
		...state,
		checkers,
		dice,
		turnSteps: [ ...state.turnSteps, { ...match, checkerId: moverId, hit } ],
		lastEvent: hit ? 'hit' : null,
	};
};
