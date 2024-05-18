/**
 * Internal dependencies
 */
import type { PlayerType } from '.';

export type LaneType = {
	from: number;
	to: number;
	player?: PlayerType;
};
