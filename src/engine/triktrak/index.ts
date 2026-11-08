/**
 * Dutch Triktrak. All checkers start off the board (on the bar lanes) and
 * enter into the opponent's home board; dice are played in a fixed order.
 */
import { stepsForDie } from '../backgammon/turns';
import { pipCount } from '../backgammon/pips';
import { applyLegalStep, handOff } from '../common';
import { BAR } from '../constants';
import { orderedLegalSteps, orderedLegalTurns, type StepsFn } from '../ordered';
import type { RulesEngine } from '../RulesEngine';
import type { Checker, GameState, Roll } from '../types';
import { PlayerType } from '../../types/PlayerType';
import { expandRoll, isDouble, isTricTrac } from './rolls';

/**
 * Step generation under this game's options. Waiting checkers do not have
 * to enter before others move; with enterOnlyOnDoubles they enter only on
 * a double or a tric trac.
 */
const stepsFor = ( state: GameState ): StepsFn => {
	const special = state.roll !== null && ( isDouble( state.roll ) || isTricTrac( state.roll ) );
	const rules = {
		barFirst: false,
		maxPerPoint: state.options.maxCheckersPerPoint,
		canEnter: ! state.options.enterOnlyOnDoubles || special,
	};
	return ( checkers, player, die ) => stepsForDie( checkers, player, die, rules );
};

/**
 * The dice of this roll are done (`completed`) or blocked. A double or a
 * tric trac earns the same player another roll, within the options;
 * otherwise the turn passes.
 */
const endSequence = ( state: GameState, completed: boolean ): GameState => {
	const { options, roll, rerolls } = state;
	const special = roll !== null && ( isDouble( roll ) || isTricTrac( roll ) );
	const earned = completed || ! options.rerollOnlyIfCompleted;
	const allowed = options.rerollLimit === null || rerolls < options.rerollLimit;
	if ( special && earned && allowed ) {
		return {
			...state,
			phase: 'awaiting-roll',
			roll: null,
			dice: [],
			turnSteps: [],
			rerolls: rerolls + 1,
			lastEvent: 'reroll',
		};
	}
	return handOff( state, ! completed );
};

export const triktrak: RulesEngine = {
	id: 'triktrak',
	supportsCube: false,
	orderedDice: true,

	initialCheckers: (): Checker[] => [
		...Array.from( { length: 15 }, ( _, i ) => ( {
			id: i + 1,
			player: PlayerType.PLAYER_ONE,
			lane: BAR[ PlayerType.PLAYER_ONE ],
		} ) ),
		...Array.from( { length: 15 }, ( _, i ) => ( {
			id: i + 16,
			player: PlayerType.PLAYER_TWO,
			lane: BAR[ PlayerType.PLAYER_TWO ],
		} ) ),
	],

	expandRoll: ( roll: Roll ) => expandRoll( roll ),

	legalSteps: ( state ) =>
		state.player === null
			? []
			: orderedLegalSteps( state.checkers, state.player, state.dice, stepsFor( state ) ),

	legalTurns: ( state ) =>
		state.player === null
			? []
			: orderedLegalTurns( state.checkers, state.player, state.dice, stepsFor( state ) ),

	applyStep: ( state, step ) => applyLegalStep( state, step, triktrak.legalSteps( state ) ),

	afterStep: ( state ) => {
		if ( state.dice.length === 0 ) return endSequence( state, true );
		if ( triktrak.legalSteps( state ).length === 0 ) return endSequence( state, false );
		return state;
	},

	onRoll: ( state, roll ) => {
		const rolled: GameState = {
			...state,
			roll,
			dice: expandRoll( roll ),
			phase: 'moving',
			turnSteps: [],
			lastEvent: null,
		};
		return triktrak.legalSteps( rolled ).length === 0 ? endSequence( rolled, false ) : rolled;
	},

	result: ( state ) => state.result,

	pipCount: ( state, player ) => pipCount( state.checkers, player ),
};
