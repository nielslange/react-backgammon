/**
 * Internal dependencies
 */
import type { NoticeType, PlayerType } from '.';
import { ActionTypes } from '.';

export type ActionType = {
	checkers: any;
	dice: number[];
	notice: {
		message: string;
		type: NoticeType;
	};
	player: PlayerType;
	type: ActionTypes;
};
