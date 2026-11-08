/**
 * Dice randomness, injectable so tests and the server can control it.
 */
import type { Roll } from '../engine/types';

/** Returns a number in [0, 1). */
export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();

/** mulberry32: small, fast, deterministic. */
export const seeded = ( seed: number ): Rng => {
	let a = seed >>> 0;
	return () => {
		a = ( a + 0x6d2b79f5 ) >>> 0;
		let t = a;
		t = Math.imul( t ^ ( t >>> 15 ), t | 1 );
		t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 );
		return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
	};
};

/** Returns exactly the given die values in order, then repeats the last. */
export const scripted = ( dice: number[] ): Rng => {
	let i = 0;
	return () => {
		const die = dice[ Math.min( i, dice.length - 1 ) ];
		i += 1;
		return ( die - 1 ) / 6;
	};
};

export const rollDie = ( rng: Rng ): number => Math.floor( rng() * 6 ) + 1;

export const rollDice = ( rng: Rng ): Roll => [ rollDie( rng ), rollDie( rng ) ];
