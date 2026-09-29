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

/** One legal landing point for a previewed checker and the die it uses. */
export type MoveOption = {
	die: number;
	to: number;
};

/**
 * The checker the player has clicked, where it stands, and every legal
 * landing point it has with the remaining dice.
 */
export type MovePreview = {
	checkerId: number;
	from: number;
	options: MoveOption[];
};

/**
 * Beginner: click a checker, its landing points light up, click one.
 * Advanced: pick a die first, then a checker click moves immediately.
 */
export type GameMode = 'beginner' | 'advanced';

export type StateType = {
	checkers: CheckerType[];
	currentPlayer: PlayerType | null;
	dice: number[];
	mode: GameMode;
	selectedDie: number | null;
	preview: MovePreview | null;
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
