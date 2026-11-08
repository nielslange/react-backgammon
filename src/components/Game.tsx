'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '../data/store';
import { PlayerType } from '../types/PlayerType';
import { Board } from './Board';
import { ActionBar } from './ActionBar';
import { CubeDialog } from './CubeDialog';
import { DiceTray, ModeSwitch } from './DiceTray';
import { GameOverDialog } from './GameOverDialog';
import { PlayerCard } from './PlayerCard';
import { Toast } from './Toast';

/**
 * The game screen. On wide screens the board sits left and the right
 * column mirrors it: Dark's card on top, the dice and actions in the
 * middle, Light's card at the bottom. On phones everything stacks.
 */
export const Game = () => {
	const idle = useSelector(
		( root: RootState ) => root.game.state.phase === 'idle'
	);

	return (
		<div className="game grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr_auto]">
			<PlayerCard
				player={ PlayerType.PLAYER_TWO }
				className="lg:col-start-2 lg:row-start-1"
			/>
			<div className="min-w-0 lg:col-start-1 lg:row-span-3 lg:row-start-1">
				<div className="overflow-hidden rounded-[18px] shadow-board">
					<Board />
				</div>
			</div>
			{ /* Two rows on phones: dice with the notice beside them, then the actions. */ }
			<div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-raised sm:p-4 lg:col-start-2 lg:row-start-2">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					{ idle ? (
						<Link
							href="/"
							className="inline-flex min-h-10 items-center justify-center rounded-control bg-accent px-4 font-medium text-accent-ink"
						>
							Set up a game
						</Link>
					) : (
						<DiceTray />
					) }
					<Toast className="min-w-48 flex-1" />
				</div>
				{ ! idle && <ActionBar extra={ <ModeSwitch /> } /> }
			</div>
			<PlayerCard
				player={ PlayerType.PLAYER_ONE }
				className="lg:col-start-2 lg:row-start-3"
			/>
			<CubeDialog />
			<GameOverDialog />
		</div>
	);
};
