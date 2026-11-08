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
		if ( state.dice.length === 0 ) return handOff( state, false );
		if ( triktrak.legalSteps( state ).length === 0 ) return handOff( state, true );
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
		return triktrak.legalSteps( rolled ).length === 0 ? handOff( rolled, true ) : rolled;
	},

	result: ( state ) => state.result,

	pipCount: ( state, player ) => pipCount( state.checkers, player ),
};
