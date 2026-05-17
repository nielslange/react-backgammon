/**
 * Internal dependencies
 */
import { CheckerType, NoticeType, PlayerType } from '../types';

export type CubeOwner = PlayerType | null;

export type CubeState = {
	value: number;
	owner: CubeOwner;
	offered: boolean;
};

export type OpeningRoll = {
	[ PlayerType.PLAYER_ONE ]: number | null;
	[ PlayerType.PLAYER_TWO ]: number | null;
};

export type StateType = {
	checkers: CheckerType[];
	currentPlayer: PlayerType | null;
	dice: number[];
	gameOver: boolean;
	notice: NoticeType;
	scores: {
		[ PlayerType.PLAYER_ONE ]: number;
		[ PlayerType.PLAYER_TWO ]: number;
	};
	pipCount: {
		[ PlayerType.PLAYER_ONE ]: number;
		[ PlayerType.PLAYER_TWO ]: number;
	};
	moveHistory: Array< {
		checkers: CheckerType[];
		currentPlayer: PlayerType | null;
		dice: number[];
		pipCount: {
			[ PlayerType.PLAYER_ONE ]: number;
			[ PlayerType.PLAYER_TWO ]: number;
		};
	} >;
	cube: CubeState;
	openingRoll: OpeningRoll;
	matchTarget: number;
	crawfordPlayed: boolean;
};
