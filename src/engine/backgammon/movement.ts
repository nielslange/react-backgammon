/**
 * Single-checker movement: where a die takes a checker, what blocks it,
 * and how one checker is moved (with a hit) on an immutable position.
 */
import { PlayerType } from '../../types/PlayerType';
import { BAR, isOnBoard, opponent } from '../constants';
import type { Checker, Player } from '../types';

/**
 * The lane a checker on `lane` reaches with `die`. Bar entry and bear-off
 * collapse to the player's entry point and off lane respectively.
 */
export const targetLane = (
	player: Player,
	lane: number,
	die: number
): number => {
	if ( player === PlayerType.PLAYER_ONE ) {
		if ( lane === 0 ) return 25 - die; // entering from the bar
		if ( lane >= 1 && lane <= 6 && lane - die < 1 ) return 25; // off
		return lane - die;
	}
	if ( lane === 25 ) return die; // entering from the bar
	if ( lane >= 19 && lane <= 24 && lane + die > 24 ) return 0; // off
	return lane + die;
};

export const countOn = (
	checkers: Checker[],
	lane: number,
	player: Player
): number =>
	checkers.reduce(
		( n, c ) => ( c.lane === lane && c.player === player ? n + 1 : n ),
		0
	);

export const hasBarChecker = ( checkers: Checker[], player: Player ): boolean =>
	countOn( checkers, BAR[ player ], player ) > 0;

/** Two or more opponent checkers block a point; off lanes never block. */
export const isBlocked = (
	checkers: Checker[],
	player: Player,
	lane: number
): boolean =>
	isOnBoard( lane ) && countOn( checkers, lane, opponent( player ) ) >= 2;

/**
 * Move one checker of `player` from `from` to `to` on a copy of the
 * position. `checkerId` is used when that checker stands on `from`,
 * otherwise the first checker of the player there. A single opponent
 * checker on `to` is hit and sent to its bar.
 */
export const moveOne = (
	checkers: Checker[],
	player: Player,
	checkerId: number | null,
	from: number,
	to: number
): { checkers: Checker[]; hit: boolean; moverId: number; victimId?: number } => {
	const next = checkers.map( ( c ) => ( { ...c } ) );
	let mover = next.find(
		( c ) =>
			c.id === checkerId && c.player === player && c.lane === from
	);
	if ( ! mover ) {
		mover = next.find( ( c ) => c.player === player && c.lane === from );
	}
	if ( ! mover ) {
		throw new Error( `No checker of ${ player } on lane ${ from }` );
	}

	let hit = false;
	let victimId: number | undefined;
	if ( isOnBoard( to ) ) {
		const victims = next.filter(
			( c ) => c.player !== player && c.lane === to
		);
		if ( victims.length === 1 ) {
			victims[ 0 ].lane = BAR[ opponent( player ) ];
			victimId = victims[ 0 ].id;
			hit = true;
		}
	}
	mover.lane = to;
	return { checkers: next, hit, moverId: mover.id, victimId };
};
