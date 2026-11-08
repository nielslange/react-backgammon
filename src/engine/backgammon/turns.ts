/**
 * Turn enumeration. A step is legal only if it starts a turn that plays
 * as many dice as possible, and when exactly one die of a non-double can
 * be played it must be the larger. Both rules fall out of `legalTurns`.
 */
import { BAR, OFF, isOnBoard, opponent } from '../constants';
import type { Checker, Player, Step, Turn } from '../types';
import { allInHome, canBearOffFrom } from './bearOff';
import {
	countOn,
	hasBarChecker,
	isBlocked,
	moveOne,
	targetLane,
} from './movement';

export type StepRules = {
	/** A checker on the bar must enter before anything else moves. */
	barFirst?: boolean;
	/** Most own checkers allowed on one point, null = no limit. */
	maxPerPoint?: number | null;
	/** Checkers on the bar may enter with this roll. */
	canEnter?: boolean;
};

/**
 * One step per lane the player may move from with `die`. With the
 * backgammon defaults a bar checker must enter first. `checkerId` is the
 * highest id on the lane so the UI moves the top of the stack.
 */
export const stepsForDie = (
	checkers: Checker[],
	player: Player,
	die: number,
	{ barFirst = true, maxPerPoint = null, canEnter = true }: StepRules = {}
): Step[] => {
	const own = checkers.filter(
		( c ) => c.player === player && c.lane !== OFF[ player ]
	);
	const lanes = (
		barFirst && hasBarChecker( checkers, player )
			? [ BAR[ player ] ]
			: [ ...new Set( own.map( ( c ) => c.lane ) ) ]
	).filter( ( lane ) => canEnter || lane !== BAR[ player ] );
	const home = allInHome( checkers, player );

	const steps: Step[] = [];
	for ( const from of lanes ) {
		const to = targetLane( player, from, die );
		if ( to === OFF[ player ] ) {
			if ( ! home || ! canBearOffFrom( checkers, player, from, die ) ) {
				continue;
			}
		} else if ( ! isOnBoard( to ) || isBlocked( checkers, player, to ) ) {
			continue;
		} else if ( maxPerPoint !== null && countOn( checkers, to, player ) >= maxPerPoint ) {
			continue;
		}
		const checkerId = Math.max(
			...own.filter( ( c ) => c.lane === from ).map( ( c ) => c.id )
		);
		const hit =
			isOnBoard( to ) && countOn( checkers, to, opponent( player ) ) === 1;
		steps.push( { checkerId, from, to, die, hit } );
	}
	return steps;
};

const enumerate = (
	checkers: Checker[],
	player: Player,
	dice: number[],
	ordered: boolean
): Turn[] => {
	if ( dice.length === 0 ) return [ [] ];

	const indices: number[] = [];
	if ( ordered ) {
		indices.push( 0 );
	} else {
		const seen = new Set< number >();
		dice.forEach( ( die, i ) => {
			if ( ! seen.has( die ) ) {
				seen.add( die );
				indices.push( i );
			}
		} );
	}

	const turns: Turn[] = [];
	for ( const i of indices ) {
		const rest = [ ...dice.slice( 0, i ), ...dice.slice( i + 1 ) ];
		for ( const step of stepsForDie( checkers, player, dice[ i ] ) ) {
			const next = moveOne(
				checkers,
				player,
				step.checkerId,
				step.from,
				step.to
			).checkers;
			for ( const tail of enumerate( next, player, rest, ordered ) ) {
				turns.push( [ step, ...tail ] );
			}
		}
	}
	return turns.length ? turns : [ [] ];
};

// The die is part of the key: the same lanes reached with swapped dice are
// different choices for the player (which die stays available differs).
const turnKey = ( turn: Turn ): string =>
	turn.map( ( s ) => `${ s.from }>${ s.to }/${ s.die }` ).join( ',' );

/**
 * Every complete turn from this position: maximal dice usage, larger die
 * when only one can be played, deduplicated by the lanes moved.
 */
export const legalTurns = (
	checkers: Checker[],
	player: Player,
	dice: number[],
	ordered: boolean
): Turn[] => {
	const all = enumerate( checkers, player, dice, ordered );
	const maxLen = Math.max( ...all.map( ( t ) => t.length ) );
	if ( maxLen === 0 ) return [];

	let turns = all.filter( ( t ) => t.length === maxLen );

	if (
		! ordered &&
		maxLen === 1 &&
		dice.length === 2 &&
		dice[ 0 ] !== dice[ 1 ]
	) {
		const larger = Math.max( dice[ 0 ], dice[ 1 ] );
		const withLarger = turns.filter( ( t ) => t[ 0 ].die === larger );
		if ( withLarger.length ) turns = withLarger;
	}

	const seen = new Set< string >();
	return turns.filter( ( t ) => {
		const key = turnKey( t );
		if ( seen.has( key ) ) return false;
		seen.add( key );
		return true;
	} );
};

/** The distinct first steps of all legal turns, one per (from, die). */
export const legalSteps = (
	checkers: Checker[],
	player: Player,
	dice: number[],
	ordered: boolean
): Step[] => {
	const seen = new Set< string >();
	const steps: Step[] = [];
	for ( const turn of legalTurns( checkers, player, dice, ordered ) ) {
		const first = turn[ 0 ];
		const key = `${ first.from }:${ first.die }`;
		if ( ! seen.has( key ) ) {
			seen.add( key );
			steps.push( first );
		}
	}
	return steps;
};
