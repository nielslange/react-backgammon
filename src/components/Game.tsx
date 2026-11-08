'use client';

/**
 * Internal dependencies
 */
import { Board, Dice, GameState, Notice, PipCount, Players } from '.';

export const Game = () => {
	return (
		<main className="game mx-auto flex max-w-[1200px] flex-wrap gap-6 p-4">
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
		</main>
	);
};
