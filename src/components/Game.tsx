'use client';

/**
 * Internal dependencies
 */
import { Board, Dice, GameState, Notice, PipCount, Players } from '.';

export const Game = () => {
	return (
		<div className="game flex flex-wrap gap-6">
			<div className="min-w-0 flex-[3] basis-[560px]">
				<Board />
			</div>
			<div className="min-w-[280px] flex-1 rounded-card border border-line bg-surface p-6 shadow-raised">
				<Players />
				<Dice />
				<PipCount />
				<GameState />
				<Notice />
			</div>
		</div>
	);
};
