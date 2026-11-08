/**
 * Position evaluation for backgammon, from one player's point of view.
 * A weighted sum of features computed for both sides; the result is
 * "my features minus theirs", so it is symmetric between the players.
 */
import { pipCount } from '../../engine/backgammon/pips';
import { BAR, HOME, OFF, opponent } from '../../engine/constants';
import type { Checker, GameState, Player } from '../../engine/types';
import { PlayerType } from '../../types/PlayerType';
import { hitProbability } from '../shots';
import type { Evaluator } from '../types';

const W = {
	pip: 1,
	blotBase: 4,
	blotPerPip: 0.5,
	homePoint: 4,
	outerPoint: 3,
	otherPoint: 1,
	prime: 1,
	anchor: 2,
	bar: 10,
	off: 2,
} as const;

/** Distance still to travel for a checker of `player` on `lane`. */
const distanceHome = ( player: Player, lane: number ) => {
	if ( lane === OFF[ player ] ) return 0;
	if ( lane === BAR[ player ] ) return 25;
	return player === PlayerType.PLAYER_ONE ? lane : 25 - lane;
};

/** How far `shooter` (a lane of `player`, bar included) is behind `target`, in the direction `player` moves. */
const gap = ( player: Player, shooter: number, target: number ) => {
	const from = shooter === BAR[ player ] ? ( player === PlayerType.PLAYER_ONE ? 25 : 0 ) : shooter;
	return player === PlayerType.PLAYER_ONE ? from - target : target - from;
};

const counts = ( checkers: Checker[], player: Player ) => {
	const byLane = new Map< number, number >();
	for ( const c of checkers ) {
		if ( c.player === player ) byLane.set( c.lane, ( byLane.get( c.lane ) ?? 0 ) + 1 );
	}
	return byLane;
};

/** Points (2+ checkers) on the board, as lanes. */
const madePoints = ( byLane: Map< number, number > ) =>
	[ ...byLane ].filter( ( [ lane, n ] ) => lane >= 1 && lane <= 24 && n >= 2 ).map( ( [ lane ] ) => lane );

const longestPrime = ( points: number[] ) => {
	const set = new Set( points );
	let best = 0;
	for ( const lane of points ) {
		if ( set.has( lane - 1 ) ) continue;
		let run = 1;
		while ( set.has( lane + run ) ) run++;
		best = Math.max( best, run );
	}
	return best;
};

/** Expected cost of `player`'s blots being hit by the opponent. */
const blotRisk = ( checkers: Checker[], player: Player ) => {
	const other = opponent( player );
	const mine = counts( checkers, player );
	const shooters = [ ...counts( checkers, other ).keys() ].filter( ( lane ) => lane !== OFF[ other ] );
	const myPoints = new Set( madePoints( mine ) );
	let risk = 0;
	for ( const [ lane, n ] of mine ) {
		if ( n !== 1 || lane < 1 || lane > 24 ) continue;
		let miss = 1;
		for ( const shooter of shooters ) {
			const d = gap( other, shooter, lane );
			if ( d < 1 || d > 24 ) continue;
			// Stopovers on my made points are blocked for the shooter.
			const blocked = new Set< number >();
			for ( let s = 1; s < d; s++ ) {
				const stop = other === PlayerType.PLAYER_ONE ? lane + d - s : lane - d + s;
				if ( myPoints.has( stop ) ) blocked.add( s );
			}
			miss *= 1 - hitProbability( d, blocked );
		}
		const lost = 25 - distanceHome( player, lane );
		risk += ( 1 - miss ) * ( W.blotBase + W.blotPerPip * lost );
	}
	return risk;
};

/** Everything except the race, for one player. */
const structure = ( checkers: Checker[], player: Player ) => {
	const byLane = counts( checkers, player );
	const points = madePoints( byLane );
	const home = new Set( HOME[ player ] );
	const otherHome = new Set( HOME[ opponent( player ) ] );
	const outer = new Set( player === PlayerType.PLAYER_ONE ? [ 7, 8, 9, 10, 11, 12 ] : [ 13, 14, 15, 16, 17, 18 ] );
	let score = 0;
	for ( const lane of points ) {
		if ( home.has( lane ) ) score += W.homePoint;
		else if ( outer.has( lane ) ) score += W.outerPoint;
		else score += W.otherPoint;
		if ( otherHome.has( lane ) ) score += W.anchor;
	}
	const prime = longestPrime( points );
	score += W.prime * prime * prime;
	score -= W.bar * ( byLane.get( BAR[ player ] ) ?? 0 );
	score += W.off * ( byLane.get( OFF[ player ] ) ?? 0 );
	score -= blotRisk( checkers, player );
	return score;
};

export const evaluateBackgammon: Evaluator = ( state: GameState, perspective: Player ) => {
	const other = opponent( perspective );
	const { checkers } = state;
	const race = pipCount( checkers, other ) - pipCount( checkers, perspective );
	return W.pip * race + structure( checkers, perspective ) - structure( checkers, other );
};
