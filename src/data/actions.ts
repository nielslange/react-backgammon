import { Player } from '../data/state';
import TYPES from './action-types';
const { ROLL_DICE, SWAP_DICE, SHIFT_DICE, TOGGLE_CURRENT_PLAYER, MOVE_PIECE } =
	TYPES;

export const rollDice = ( dice: number[] ) => {
	return { type: ROLL_DICE, dice };
};

export const swapDice = ( dice: number[] ) => {
	return { type: SWAP_DICE, dice };
};

export const shiftDice = ( dice: number[] ) => {
	return { type: SHIFT_DICE, dice };
};

export const toggleCurrentPlayer = ( { player }: { player: Player } ) => {
	return { type: TOGGLE_CURRENT_PLAYER, player };
};

export const moveChecker = ( {
	player,
	id,
}: {
	player: Player;
	id: number;
} ) => {
	return { type: MOVE_PIECE, player, id };
};
