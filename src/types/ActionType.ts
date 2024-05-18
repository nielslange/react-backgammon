/**
 * Internal dependencies
 */
import type { CheckerType, NoticeStatusType, PlayerType } from '.';
import { ActionTypes } from '.';

export type ActionType = {
	checkers: CheckerType;
	dice: number[];
	notice: {
		message: string;
		type: NoticeStatusType;
	};
	player: PlayerType;
	type: ActionTypes;
};
