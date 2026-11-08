import type { GameState, Player, Turn } from '../engine/types';
import type { Level } from './types';

/** How the turn driver talks to the computer player (in-process or a worker). */
export type AiPort = {
	requestTurn( state: GameState, level: Level, seed: number ): Promise< Turn >;
	decideCube( state: GameState, player: Player, level: Level ): Promise< 'double' | 'roll' >;
	answerDouble( state: GameState, player: Player, level: Level ): Promise< 'take' | 'drop' >;
};
