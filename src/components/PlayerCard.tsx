'use client';

import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { selectPipCounts } from '../data/selectors';
import type { RootState } from '../data/store';
import type { Player } from '../engine/types';
import { PlayerType } from '../types/PlayerType';

const Swatch = ( { player }: { player: Player } ) => {
	const light = player === PlayerType.PLAYER_ONE;
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 shrink-0">
			<circle
				cx="12"
				cy="12"
				r="10.5"
				fill={ light ? 'var(--color-checker-light)' : 'var(--color-checker-dark)' }
				stroke={ light ? 'var(--color-checker-light-rim)' : 'var(--color-checker-dark-rim)' }
				strokeWidth="1.5"
			/>
			<circle
				cx="12"
				cy="12"
				r="6.5"
				fill="none"
				stroke={ light ? 'var(--color-checker-light-rim)' : 'var(--color-checker-dark-rim)' }
				strokeOpacity="0.5"
			/>
		</svg>
	);
};

/** One player: name, colour, pips, match score, cube ownership, turn. */
export const PlayerCard = ( { player, className }: { player: Player; className?: string } ) => {
	const seat = useSelector( ( root: RootState ) => root.session.players[ player ] );
	const score = useSelector( ( root: RootState ) => root.session.scores[ player ] );
	const target = useSelector( ( root: RootState ) => root.session.matchTarget );
	const pips = useSelector( selectPipCounts )[ player ];
	const cube = useSelector( ( root: RootState ) => root.game.state.cube );
	const toMove = useSelector(
		( root: RootState ) =>
			root.game.state.player === player &&
			( root.game.state.phase === 'moving' || root.game.state.phase === 'awaiting-roll' )
	);

	return (
		<section
			aria-label={ seat.name }
			data-to-move={ toMove ? 'true' : undefined }
			className={ clsx(
				'flex items-center gap-3 rounded-card border bg-surface px-4 py-3 shadow-raised transition-colors',
				toMove ? 'border-2 border-focus' : 'border-2 border-line',
				className
			) }
		>
			<Swatch player={ player } />
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate font-semibold">{ seat.name }</span>
					{ toMove && (
						<span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-ink">
							To move
						</span>
					) }
				</div>
				<div className="text-sm text-muted tabular-nums">{ pips } pips</div>
			</div>
			{ cube.owner === player && (
				<span
					aria-label={ `Doubling cube at ${ cube.value }` }
					className="grid size-8 place-items-center rounded-[6px] border-2 border-control bg-canvas text-sm font-bold tabular-nums"
				>
					{ cube.value }
				</span>
			) }
			<div className="text-right">
				<div className="text-lg font-semibold tabular-nums">
					{ score } <span className="text-sm font-normal text-muted">/ { target }</span>
				</div>
				<div className="text-xs text-muted">score</div>
			</div>
		</section>
	);
};
