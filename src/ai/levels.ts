import type { Level, LevelConfig } from './types';

export const LEVELS: Record< Level, LevelConfig > = {
	easy: { ply: 0 },
	medium: { ply: 1, topK: 3, noise: 0.2 },
	hard: { ply: 2, topN: 8 },
};
