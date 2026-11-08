'use client';

/**
 * Internal dependencies
 */
import { Board, Dice, GameState, Notice, PipCount, Players } from '.';

export const Game = () => {
	return (
		<div className="game flex flex-wrap gap-6">
			<div className="rounded-card border border-line bg-surface p-6 shadow-raised">
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
