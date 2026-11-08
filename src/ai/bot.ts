/**
 * The computer player: picks a turn for a level, decides on the cube.
 * Pure functions; randomness comes in as an Rng.
 */
import { getEngine } from '../engine';
import { opponent } from '../engine/constants';
import type { GameState, Player, Turn, VariantId } from '../engine/types';
import type { Rng } from '../runtime/rng';
import { evaluateBackgammon } from './features/backgammon';
import { LEVELS } from './levels';
import { ROLLS, candidateTurns, onePly, twoPly } from './search';
import type { Evaluator, Level } from './types';

const EVALUATORS: Partial< Record< VariantId, Evaluator > > = {
	backgammon: evaluateBackgammon,
};

export const evaluatorFor = ( variant: VariantId ): Evaluator => EVALUATORS[ variant ] ?? evaluateBackgammon;

/** A legal turn for the player to move, chosen at `level`. Empty when nothing can be played. */
export const chooseTurn = ( state: GameState, level: Level, rng: Rng ): Turn => {
	const evaluator = evaluatorFor( state.variant );
	const config = LEVELS[ level ];
	if ( config.ply === 0 ) {
		const turns = candidateTurns( state, evaluator );
		return turns.length ? turns[ Math.floor( rng() * turns.length ) ] : [];
	}
	if ( config.ply === 1 ) {
		const ranked = onePly( state, evaluator );
		if ( ranked.length === 0 ) return [];
		if ( config.noise && rng() < config.noise ) {
			const pool = ranked.slice( 0, config.topK ?? 1 );
			return pool[ Math.floor( rng() * pool.length ) ].turn;
		}
		return ranked[ 0 ].turn;
	}
	const ranked = twoPly( state, evaluator, { topN: config.topN } );
	return ranked.length ? ranked[ 0 ].turn : [];
};

/** Pips of evaluation that make a 50/50 game a 73/27 one. */
const SCALE = 25;

/**
 * Winning chances for `player` if they roll next: their best one-ply result
 * averaged over the 21 rolls, mapped through a logistic curve.
 */
export const winProbability = ( state: GameState, player: Player ): number => {
	const evaluator = evaluatorFor( state.variant );
	const engine = getEngine( state.variant );
	let expected = 0;
	for ( const { roll, weight } of ROLLS ) {
		const s: GameState = {
			...state,
			player,
			phase: 'moving',
			roll,
			dice: engine.expandRoll( roll, state.options ),
			turnSteps: [],
		};
		const best = onePly( s, evaluator, 6 )[ 0 ];
		expected += weight * ( best ? best.score : evaluator( s, player ) );
	}
	return 1 / ( 1 + Math.exp( -expected / SCALE ) );
};

const DOUBLE_AT = 0.68;
const TAKE_AT = 0.25;

/** Before rolling: should `player` offer the cube? Only the hard level doubles. */
export const decideCube = ( state: GameState, player: Player, level: Level ): 'double' | 'roll' =>
	level === 'hard' && winProbability( state, player ) >= DOUBLE_AT ? 'double' : 'roll';

/** `player` was offered the cube by the player about to roll. Easy always takes. */
export const answerDouble = ( state: GameState, player: Player, level: Level ): 'take' | 'drop' => {
	if ( level === 'easy' ) return 'take';
	const theirs = winProbability( state, opponent( player ) );
	return 1 - theirs >= TAKE_AT ? 'take' : 'drop';
};
