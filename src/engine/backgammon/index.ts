/**
 * The backgammon rules engine.
 */
import startCheckers from '../../data/checkers-start.json';
import { applyLegalStep, handOff } from '../common';
import type { RulesEngine } from '../RulesEngine';
import type { Checker, GameState, Roll, Step } from '../types';
import { pipCount } from './pips';
import { gameResult } from './result';
import { legalSteps, legalTurns, stepsForDie } from './turns';
import { allInHome } from './bearOff';
import { hasBarChecker, isBlocked, targetLane } from './movement';
import { BAR, OFF } from '../constants';
import { MessageType } from '../../types/MessageType';

const ORDERED = false;

export const backgammon: RulesEngine = {
	id: 'backgammon',
	supportsCube: true,
	orderedDice: ORDERED,

	initialCheckers: (): Checker[] =>
		( startCheckers as Checker[] ).map( ( c ) => ( { ...c } ) ),

	expandRoll: ( [ a, b ]: Roll ): number[] =>
		a === b ? [ a, a, a, a ] : [ Math.max( a, b ), Math.min( a, b ) ],

	legalSteps: ( state ) =>
		state.player === null
			? []
			: legalSteps( state.checkers, state.player, state.dice, ORDERED ),

	legalTurns: ( state ) =>
		state.player === null
			? []
			: legalTurns( state.checkers, state.player, state.dice, ORDERED ),

	applyStep: ( state, step: Step ) =>
		applyLegalStep( state, step, backgammon.legalSteps( state ) ),

	afterStep: ( state ) => {
		const result = gameResult( state.checkers, state.cube.value );
		if ( result ) {
			return { ...state, phase: 'over', result, lastEvent: 'game-over' };
		}
		if ( state.dice.length === 0 ) return handOff( state, false );
		if ( backgammon.legalSteps( state ).length === 0 ) {
			return handOff( state, true );
		}
		return state;
	},

	onRoll: ( state, roll ) => {
		const rolled: GameState = {
			...state,
			roll,
			dice: backgammon.expandRoll( roll, state.options ),
			phase: 'moving',
			turnSteps: [],
			lastEvent: null,
		};
		if ( backgammon.legalSteps( rolled ).length === 0 ) {
			return handOff( rolled, true );
		}
		return rolled;
	},

	result: ( state ) => gameResult( state.checkers, state.cube.value ),

	pipCount: ( state, player ) => pipCount( state.checkers, player ),

	explainRefusal: ( state, checkerId ) => {
		const player = state.player;
		const checker = state.checkers.find( ( c ) => c.id === checkerId );
		if ( player === null || ! checker ) return null;
		if ( backgammon.legalSteps( state ).some( ( s ) => s.from === checker.lane ) ) return null;
		if ( checker.lane === OFF[ player ] ) return MessageType.FINISHED_CHECKER;
		if ( hasBarChecker( state.checkers, player ) && checker.lane !== BAR[ player ] ) {
			return MessageType.WAITING_CHECKER;
		}
		const dice = [ ...new Set( state.dice ) ];
		const targets = dice.map( ( die ) => targetLane( player, checker.lane, die ) );
		if ( targets.some( ( to ) => isBlocked( state.checkers, player, to ) ) ) {
			return MessageType.TARGET_OCCUPIED_BY_OPPONENT;
		}
		if ( targets.some( ( to ) => to === OFF[ player ] ) && ! allInHome( state.checkers, player ) ) {
			return MessageType.NOT_ALL_CHECKERS_IN_END_ZONE;
		}
		const rawMove = dice.some( ( die ) =>
			stepsForDie( state.checkers, player, die ).some( ( s ) => s.from === checker.lane )
		);
		return rawMove ? MessageType.MUST_PLAY_MAX_DICE : MessageType.NO_MOVE_FOR_CHECKER;
	},
};
