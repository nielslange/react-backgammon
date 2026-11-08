/**
 * The computer player in the calling thread: for tests, and as the fallback
 * where Web Workers are unavailable.
 */
import { seeded } from '../runtime/rng';
import { answerDouble, chooseTurn, decideCube } from './bot';
import type { AiPort } from './port';

export const localAi: AiPort = {
	requestTurn: async ( state, level, seed ) => chooseTurn( state, level, seeded( seed ) ),
	decideCube: async ( state, player, level ) => decideCube( state, player, level ),
	answerDouble: async ( state, player, level ) => answerDouble( state, player, level ),
};
