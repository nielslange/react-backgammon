/**
 * Internal dependencies
 */
import type { PlayerType } from '.';

export type CheckerType = {
	className?: string;
	currentPlayer?: PlayerType;
	lane: number;
	id: number;
	player: PlayerType;
};
