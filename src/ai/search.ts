/**
 * Move search. Candidate turns are the legal turns, one per distinct final
 * position; one-ply ranks them by evaluation, two-ply also looks at the
 * opponent's best reply to each of the 21 rolls.
 */
import { moveOne } from '../engine/backgammon/movement';
import { stepsForDie } from '../engine/backgammon/turns';
import { getEngine } from '../engine';
import { BAR, OFF, opponent } from '../engine/constants';
import type { Checker, GameState, Player, Roll, Turn } from '../engine/types';
import { PlayerType } from '../types/PlayerType';
import type { Evaluator } from './types';

export type Ranked = { turn: Turn; score: number };

/** Checkers after playing `turn` (no turn-end logic). */
export const finalCheckers = ( state: GameState, turn: Turn ): Checker[] =>
	turn.reduce(
		( checkers, step ) => moveOne( checkers, state.player!, step.checkerId, step.from, step.to ).checkers,
		state.checkers
	);

const positionKey = ( checkers: Checker[] ) =>
	[ PlayerType.PLAYER_ONE, PlayerType.PLAYER_TWO ]
		.map( ( p ) =>
			checkers
				.filter( ( c ) => c.player === p )
				.map( ( c ) => c.lane )
				.sort( ( a, b ) => a - b )
				.join( ',' )
		)
		.join( '|' );

type Candidate = { turn: Turn; checkers: Checker[] };

/** Turns with their final checkers, one per distinct final position. */
const dedupe = ( state: GameState, turns: Turn[] ): Candidate[] => {
	const seen = new Set< string >();
	const out: Candidate[] = [];
	for ( const turn of turns ) {
		const checkers = finalCheckers( state, turn );
		const key = positionKey( checkers );
		if ( seen.has( key ) ) continue;
		seen.add( key );
		out.push( { turn, checkers } );
	}
	return out;
};

/** How far a checker still has to go: moving it earlier in a canonical order. */
const rank = ( player: Player, lane: number ) => {
	if ( lane === BAR[ player ] ) return 25;
	if ( lane === OFF[ player ] ) return 0;
	return player === PlayerType.PLAYER_ONE ? lane : 25 - lane;
};

/**
 * Backgammon doubles: moves of the same size commute, so only orders that
 * never move a checker further from home than the previous one are tried.
 * Same final positions as the full enumeration, far fewer paths.
 */
const canonicalDoubles = ( checkers: Checker[], player: Player, die: number, count: number ): Turn[] => {
	const turns: Turn[] = [];
	const walk = ( current: Checker[], left: number, limit: number, path: Turn ) => {
		const steps = left === 0 ? [] : stepsForDie( current, player, die ).filter( ( s ) => rank( player, s.from ) <= limit );
		if ( steps.length === 0 ) {
			turns.push( path );
			return;
		}
		for ( const step of steps ) {
			const next = moveOne( current, player, step.checkerId, step.from, step.to ).checkers;
			walk( next, left - 1, rank( player, step.from ), [ ...path, step ] );
		}
	};
	walk( checkers, count, 25, [] );
	const max = Math.max( 0, ...turns.map( ( t ) => t.length ) );
	return max === 0 ? [] : turns.filter( ( t ) => t.length === max );
};

/**
 * Ordered dice with many dice (a Triktrak tric trac): grow the turn die by
 * die, keeping the `width` best positions after each die. Every step comes
 * from the engine's legal steps, so the result is always legal.
 */
const beamTurns = ( state: GameState, evaluator: Evaluator, width: number ): Candidate[] => {
	const engine = getEngine( state.variant );
	const player = state.player!;
	let frontier: Array< { s: GameState; path: Turn } > = [ { s: state, path: [] } ];
	let finished: Candidate[] = [];
	while ( frontier.length ) {
		const next = new Map< string, { s: GameState; path: Turn; score: number } >();
		for ( const node of frontier ) {
			const steps = node.s.dice.length ? engine.legalSteps( node.s ) : [];
			if ( steps.length === 0 ) {
				finished.push( { turn: node.path, checkers: node.s.checkers } );
				continue;
			}
			for ( const step of steps ) {
				const s = engine.applyStep( node.s, step );
				const key = positionKey( s.checkers );
				if ( next.has( key ) ) continue;
				next.set( key, { s, path: [ ...node.path, step ], score: evaluator( s, player ) } );
			}
		}
		frontier = [ ...next.values() ].sort( ( a, b ) => b.score - a.score ).slice( 0, width );
	}
	const max = Math.max( 0, ...finished.map( ( c ) => c.turn.length ) );
	finished = finished.filter( ( c ) => c.turn.length === max && max > 0 );
	return finished;
};

const BEAM_WIDTH = 24;

type SearchOptions = {
	/** Positions kept per die in the beam. */
	beamWidth?: number;
	/** Ordered rolls with more dice than this are searched with the beam. */
	beamAbove?: number;
};

const candidates = (
	state: GameState,
	evaluator: Evaluator,
	{ beamWidth = BEAM_WIDTH, beamAbove = 4 }: SearchOptions = {}
): Candidate[] => {
	if ( state.player === null || state.dice.length === 0 ) return [];
	const engine = getEngine( state.variant );
	const { dice } = state;
	if ( engine.orderedDice && dice.length > beamAbove ) return beamTurns( state, evaluator, beamWidth );
	if ( ! engine.orderedDice && dice.length > 2 && dice.every( ( d ) => d === dice[ 0 ] ) ) {
		return dedupe( state, canonicalDoubles( state.checkers, state.player, dice[ 0 ], dice.length ) );
	}
	return dedupe( state, engine.legalTurns( state ) );
};

/** Distinct legal turns for the player to move. */
export const candidateTurns = ( state: GameState, evaluator: Evaluator, options?: SearchOptions ): Turn[] =>
	candidates( state, evaluator, options ).map( ( c ) => c.turn );

export const onePly = ( state: GameState, evaluator: Evaluator, options?: SearchOptions ): Ranked[] => {
	const player = state.player;
	if ( player === null ) return [];
	return candidates( state, evaluator, options )
		.map( ( { turn, checkers } ) => ( { turn, score: evaluator( { ...state, checkers }, player ) } ) )
		.sort( ( a, b ) => b.score - a.score );
};

export const ROLLS: Array< { roll: Roll; weight: number } > = [];
for ( let a = 1; a <= 6; a++ ) {
	for ( let b = a; b <= 6; b++ ) ROLLS.push( { roll: [ a, b ], weight: a === b ? 1 / 36 : 2 / 36 } );
}

/**
 * For the best `topN` one-ply turns: the opponent's best reply to each roll,
 * averaged by probability. A turn is as good as the reply it leaves is bad.
 */
export const twoPly = ( state: GameState, evaluator: Evaluator, { topN = 8 }: { topN?: number } = {} ): Ranked[] => {
	const player = state.player;
	if ( player === null ) return [];
	const engine = getEngine( state.variant );
	const other = opponent( player );
	// Eight-die turns (a tric trac) look deeper at fewer candidates.
	const ranked = onePly( state, evaluator ).slice( 0, state.dice.length > 4 ? Math.min( topN, 4 ) : topN );
	return ranked
		.map( ( { turn } ) => {
			const checkers = finalCheckers( state, turn );
			let expected = 0;
			for ( const { roll, weight } of ROLLS ) {
				const reply: GameState = {
					...state,
					checkers,
					player: other,
					phase: 'moving',
					roll,
					dice: engine.expandRoll( roll, state.options ),
					turnSteps: [],
				};
				// A narrow beam keeps replies with doubles and tric tracs affordable.
				const best = onePly( reply, evaluator, { beamWidth: 6, beamAbove: 2 } )[ 0 ];
				expected += weight * ( best ? best.score : evaluator( reply, other ) );
			}
			return { turn, score: -expected };
		} )
		.sort( ( a, b ) => b.score - a.score );
};
