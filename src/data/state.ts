export type Player = 'PLAYER_BLUE' | 'PLAYER_RED';

export interface CheckerProps {
	id: number;
	player: Player;
	lane: number;
}

interface State {
	message: string;
	count: number;
	dice: number[];
	currentPlayer: Player;
	scores: {
		PLAYER_BLUE: number;
		PLAYER_RED: number;
	};
	checkers: CheckerProps[];
}

export const initialState: State = {
	message: '🐈 🐈 🐈',
	count: 0,
	dice: [],
	currentPlayer: 'PLAYER_BLUE',
	scores: {
		PLAYER_BLUE: 0,
		PLAYER_RED: 0,
	},
	checkers: [
		{ id: 1, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 2, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 3, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 4, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 5, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 6, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 7, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 8, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 9, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 10, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 11, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 12, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 13, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 14, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 15, player: 'PLAYER_BLUE', lane: 0 },
		{ id: 16, player: 'PLAYER_RED', lane: 0 },
		{ id: 17, player: 'PLAYER_RED', lane: 0 },
		{ id: 18, player: 'PLAYER_RED', lane: 0 },
		{ id: 19, player: 'PLAYER_RED', lane: 0 },
		{ id: 20, player: 'PLAYER_RED', lane: 0 },
		{ id: 21, player: 'PLAYER_RED', lane: 0 },
		{ id: 22, player: 'PLAYER_RED', lane: 0 },
		{ id: 23, player: 'PLAYER_RED', lane: 0 },
		{ id: 24, player: 'PLAYER_RED', lane: 0 },
		{ id: 25, player: 'PLAYER_RED', lane: 0 },
		{ id: 26, player: 'PLAYER_RED', lane: 0 },
		{ id: 27, player: 'PLAYER_RED', lane: 0 },
		{ id: 28, player: 'PLAYER_RED', lane: 0 },
		{ id: 29, player: 'PLAYER_RED', lane: 0 },
		{ id: 30, player: 'PLAYER_RED', lane: 0 },
	],
};
