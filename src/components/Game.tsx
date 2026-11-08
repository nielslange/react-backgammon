'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '../data/store';
import { PlayerType } from '../types/PlayerType';
import { Board } from './Board';
import { DiceTray } from './DiceTray';
import { GameState } from './GameState';
import { Notice } from './Notice';
import { PlayerCard } from './PlayerCard';

/**
 * The game screen. On wide screens the board sits left and the right
 * column mirrors it: Dark's card on top, the dice and actions in the
 * middle, Light's card at the bottom. On phones everything stacks.
 */
export const Game = () => {
	const idle = useSelector( ( root: RootState ) => root.game.state.phase === 'idle' );

	return (
		<div className="game grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr_auto]">
			<PlayerCard player={ PlayerType.PLAYER_TWO } className="lg:col-start-2 lg:row-start-1" />
			<div className="min-w-0 lg:col-start-1 lg:row-span-3 lg:row-start-1">
				<div className="overflow-hidden rounded-[18px] shadow-board">
					<Board />
				</div>
			</div>
			<div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-raised lg:col-start-2 lg:row-start-2">
				{ idle ? (
					<Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-control bg-accent px-4 font-medium text-accent-ink">
						Set up a game
					</Link>
				) : (
					<DiceTray />
				) }
				<Notice />
				<GameState />
			</div>
			<PlayerCard player={ PlayerType.PLAYER_ONE } className="lg:col-start-2 lg:row-start-3" />
		</div>
	);
};
