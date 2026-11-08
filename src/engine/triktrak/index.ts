/**
 * Dutch Triktrak. All checkers start off the board (on the bar lanes) and
 * enter into the opponent's home board; dice are played in a fixed order.
 */
import { stepsForDie } from '../backgammon/turns';
import { allInHome } from '../backgammon/bearOff';
import { countOn, isBlocked, targetLane } from '../backgammon/movement';
import { MessageType } from '../../types/MessageType';
import { pipCount } from '../backgammon/pips';
import { applyLegalStep, handOff } from '../common';
import { BAR, HOME, OFF, opponent } from '../constants';
import { orderedLegalSteps, orderedLegalTurns, type StepsFn } from '../ordered';
import type { RulesEngine } from '../RulesEngine';
import type { Checker, GameState, Player, Roll } from '../types';
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
		homeLocked: true,
		exactBearOff: true,
		maxPerPoint: state.options.maxCheckersPerPoint,
		canEnter: ! state.options.enterOnlyOnDoubles || special,
	};
	// Only hit checkers (bar checkers beyond the never-entered count) must
	// enter before anything else moves.
	return ( checkers, player, die ) =>
		stepsForDie( checkers, player, die, {
			...rules,
			barFirst: countOn( checkers, BAR[ player ], player ) > state.waiting[ player ],
		} );
};

const allOff = ( checkers: Checker[], player: Player ) =>
	checkers.every( ( c ) => c.player !== player || c.lane === OFF[ player ] );

const finish = ( state: GameState, winner: Player | null ): GameState => ( {
	...state,
	phase: 'over',
	roll: null,
	dice: [],
	result: winner === null ? { winner: null, points: 0, kind: 'draw' } : { winner, points: 1, kind: 'single' },
	lastEvent: 'game-over',
} );

/** The second player is taking the one roll they get after the first mover finished. */
const inFinalTurn = ( state: GameState ): boolean =>
	state.firstMover !== null &&
	state.player === opponent( state.firstMover ) &&
	allOff( state.checkers, state.firstMover );

/**
 * The dice of this roll are done (`completed`) or blocked. A double or a
 * tric trac earns the same player another roll, within the options;
 * otherwise the turn passes.
 */
const endSequence = ( state: GameState, completed: boolean ): GameState => {
	// The final turn is one roll: when it ends, the first mover has won.
	if ( inFinalTurn( state ) ) return finish( state, state.firstMover );
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

	applyStep: ( state, step ) => {
		const next = applyLegalStep( state, step, triktrak.legalSteps( state ) );
		const player = state.player!;
		const onBar = countOn( state.checkers, BAR[ player ], player );
		// Entering while no hit checker waits uses up a first entry.
		if ( step.from !== BAR[ player ] || onBar > state.waiting[ player ] ) return next;
		const steps = [ ...next.turnSteps ];
		steps[ steps.length - 1 ] = { ...steps[ steps.length - 1 ], firstEntry: true };
		return {
			...next,
			turnSteps: steps,
			waiting: { ...state.waiting, [ player ]: state.waiting[ player ] - 1 },
		};
	},

	afterStep: ( state ) => {
		const mover = state.player;
		if ( mover !== null && allOff( state.checkers, mover ) ) {
			if ( inFinalTurn( state ) ) return finish( state, null );
			const second = opponent( mover );
			if ( mover === state.firstMover && state.options.finalTurnForSecondPlayer ) {
				return { ...handOff( state, false ), player: second, lastEvent: 'final-turn' };
			}
			return finish( state, mover );
		}
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

	explainRefusal: ( state, checkerId ) => {
		const player = state.player;
		const checker = state.checkers.find( ( c ) => c.id === checkerId );
		if ( player === null || ! checker || state.dice.length === 0 ) return null;
		if ( triktrak.legalSteps( state ).some( ( s ) => s.from === checker.lane ) ) return null;
		if ( checker.lane === OFF[ player ] ) return MessageType.FINISHED_CHECKER;
		const hitWaiting = countOn( state.checkers, BAR[ player ], player ) > state.waiting[ player ];
		if ( hitWaiting && checker.lane !== BAR[ player ] ) return MessageType.WAITING_CHECKER;
		const special = state.roll !== null && ( isDouble( state.roll ) || isTricTrac( state.roll ) );
		if ( checker.lane === BAR[ player ] && state.options.enterOnlyOnDoubles && ! special ) {
			return MessageType.ENTER_ON_DOUBLES;
		}
		const next = state.dice[ 0 ];
		const stepsNow = stepsFor( state );
		const movesWith = ( die: number ) =>
			stepsNow( state.checkers, player, die ).some( ( s ) => s.from === checker.lane );
		// A later die would work: the order is what stops this checker.
		if ( ! movesWith( next ) && state.dice.slice( 1 ).some( movesWith ) ) {
			return MessageType.PLAY_DICE_IN_ORDER;
		}
		const to = targetLane( player, checker.lane, next );
		const distance = player === PlayerType.PLAYER_ONE ? checker.lane : 25 - checker.lane;
		if ( to === OFF[ player ] && allInHome( state.checkers, player ) && next !== distance ) {
			return MessageType.BEAR_OFF_EXACT;
		}
		if ( HOME[ player ].includes( checker.lane ) && to !== OFF[ player ] ) {
			return MessageType.HOME_BOARD_LOCKED;
		}
		if ( isBlocked( state.checkers, player, to ) ) return MessageType.TARGET_OCCUPIED_BY_OPPONENT;
		const limit = state.options.maxCheckersPerPoint;
		if ( limit !== null && to !== OFF[ player ] && countOn( state.checkers, to, player ) >= limit ) {
			return MessageType.POINT_FULL;
		}
		if ( to === OFF[ player ] && ! allInHome( state.checkers, player ) ) {
			return MessageType.NOT_ALL_CHECKERS_IN_END_ZONE;
		}
		return movesWith( next ) ? MessageType.MUST_PLAY_MAX_DICE : MessageType.NO_MOVE_FOR_CHECKER;
	},
};
