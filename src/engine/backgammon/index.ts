/**
 * The backgammon rules engine.
 */
import startCheckers from '../../data/checkers-start.json';
import { EngineError } from '../errors';
import { opponent } from '../constants';
import type { RulesEngine } from '../RulesEngine';
import type { Checker, GameState, Roll, Step } from '../types';
import { moveOne } from './movement';
import { pipCount } from './pips';
import { gameResult } from './result';
import { legalSteps, legalTurns } from './turns';

const ORDERED = false;

/** Hand the turn to the opponent, who must now roll. */
const handOff = ( state: GameState, forfeited: boolean ): GameState => ( {
	...state,
	player: state.player === null ? null : opponent( state.player ),
	phase: 'awaiting-roll',
	roll: null,
	dice: [],
	turnSteps: [],
	rerolls: 0,
	lastEvent: forfeited ? 'forfeit' : 'hand-off',
} );

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

	applyStep: ( state, step: Step ) => {
		if ( state.player === null ) {
			throw new EngineError( 'NOT_YOUR_TURN' );
		}
		const legal = backgammon
			.legalSteps( state )
			.find( ( s ) => s.from === step.from && s.die === step.die );
		if ( ! legal ) {
			throw new EngineError( 'ILLEGAL_STEP' );
		}
		const { checkers, hit, moverId } = moveOne(
			state.checkers,
			state.player,
			step.checkerId,
			legal.from,
			legal.to
		);
		const dice = [ ...state.dice ];
		dice.splice( dice.indexOf( step.die ), 1 );
		const played: Step = { ...legal, checkerId: moverId, hit };
		return {
			...state,
			checkers,
			dice,
			turnSteps: [ ...state.turnSteps, played ],
			lastEvent: hit ? 'hit' : null,
		};
	},

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
};
