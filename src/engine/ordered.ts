/**
 * Legal steps and turns when dice must be played in a fixed order (Triktrak).
 * The next die is always dice[0]; a blocked die ends the sequence. Where the
 * player has a choice, they must pick a line that plays as many dice as
 * possible. Positions are memoised, so eight dice stay cheap.
 */
import { moveOne } from './backgammon/movement';
import type { Checker, Player, Step, Turn } from './types';

export type StepsFn = ( checkers: Checker[], player: Player, die: number ) => Step[];

/** Same key for positions that differ only in which checker id stands where. */
const positionKey = ( checkers: Checker[] ): string => {
	const lanes = ( p: string ) =>
		checkers
			.filter( ( c ) => c.player === p )
			.map( ( c ) => c.lane )
			.sort( ( a, b ) => a - b )
			.join( ',' );
	const players = [ ...new Set( checkers.map( ( c ) => c.player ) ) ].sort();
	return players.map( lanes ).join( '|' );
};

const apply = ( checkers: Checker[], player: Player, step: Step ) =>
	moveOne( checkers, player, step.checkerId, step.from, step.to ).checkers;

/** Most dice playable from `checkers` starting at dice[k]. */
const maxPlayable = ( dice: number[], player: Player, stepsFn: StepsFn ) => {
	const memo = new Map< string, number >();
	const best = ( checkers: Checker[], k: number ): number => {
		if ( k === dice.length ) return 0;
		const key = `${ k }:${ positionKey( checkers ) }`;
		const cached = memo.get( key );
		if ( cached !== undefined ) return cached;
		let most = 0;
		for ( const step of stepsFn( checkers, player, dice[ k ] ) ) {
			most = Math.max( most, 1 + best( apply( checkers, player, step ), k + 1 ) );
			if ( most === dice.length - k ) break;
		}
		memo.set( key, most );
		return most;
	};
	return best;
};

export const orderedLegalSteps = (
	checkers: Checker[],
	player: Player,
	dice: number[],
	stepsFn: StepsFn
): Step[] => {
	if ( dice.length === 0 ) return [];
	const best = maxPlayable( dice, player, stepsFn );
	const scored = stepsFn( checkers, player, dice[ 0 ] ).map( ( step ) => ( {
		step,
		length: 1 + best( apply( checkers, player, step ), 1 ),
	} ) );
	const max = Math.max( 0, ...scored.map( ( s ) => s.length ) );
	return scored.filter( ( s ) => s.length === max ).map( ( s ) => s.step );
};

/**
 * Every maximal turn, one per distinct position after each die: the
 * same final position reached by different orders is listed once.
 */
export const orderedLegalTurns = (
	checkers: Checker[],
	player: Player,
	dice: number[],
	stepsFn: StepsFn
): Turn[] => {
	let frontier = new Map< string, { checkers: Checker[]; path: Turn } >( [
		[ 'start', { checkers, path: [] } ],
	] );
	for ( let k = 0; k < dice.length; k++ ) {
		const next = new Map< string, { checkers: Checker[]; path: Turn } >();
		for ( const node of frontier.values() ) {
			for ( const step of stepsFn( node.checkers, player, dice[ k ] ) ) {
				const after = apply( node.checkers, player, step );
				const key = positionKey( after );
				if ( ! next.has( key ) ) next.set( key, { checkers: after, path: [ ...node.path, step ] } );
			}
		}
		if ( next.size === 0 ) break;
		frontier = next;
	}
	const turns = [ ...frontier.values() ].map( ( n ) => n.path );
	return turns.length && turns[ 0 ].length ? turns : [];
};
