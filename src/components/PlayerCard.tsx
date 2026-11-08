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
				fill={
					light
						? 'var(--color-checker-light)'
						: 'var(--color-checker-dark)'
				}
				stroke={
					light
						? 'var(--color-checker-light-rim)'
						: 'var(--color-checker-dark-rim)'
				}
				strokeWidth="1.5"
			/>
			<circle
				cx="12"
				cy="12"
				r="6.5"
				fill="none"
				stroke={
					light
						? 'var(--color-checker-light-rim)'
						: 'var(--color-checker-dark-rim)'
				}
				strokeOpacity="0.5"
			/>
		</svg>
	);
};

/** One player: name, colour, pips, match score, cube ownership, turn. */
export const PlayerCard = ( {
	player,
	className,
	compact = false,
}: {
	player: Player;
	className?: string;
	/** A slim one-line strip for phones in portrait. */
	compact?: boolean;
} ) => {
	const seat = useSelector(
		( root: RootState ) => root.session.players[ player ]
	);
	const score = useSelector(
		( root: RootState ) => root.session.scores[ player ]
	);
	const target = useSelector(
		( root: RootState ) => root.session.matchTarget
	);
	const pips = useSelector( selectPipCounts )[ player ];
	const cube = useSelector( ( root: RootState ) => root.game.state.cube );
	const online = useSelector(
		( root: RootState ) => root.net?.opponentOnline ?? false
	);
	const toMove = useSelector(
		( root: RootState ) =>
			root.game.state.player === player &&
			( root.game.state.phase === 'moving' ||
				root.game.state.phase === 'awaiting-roll' )
	);

	return (
		<section
			aria-label={ seat.name }
			data-to-move={ toMove ? 'true' : undefined }
			data-compact={ compact ? 'true' : undefined }
			className={ clsx(
				'flex items-center gap-3 rounded-card border bg-surface shadow-raised transition-colors',
				compact ? 'px-3 py-1.5' : 'px-4 py-3',
				toMove ? 'border-2 border-focus' : 'border-2 border-line',
				className
			) }
		>
			<Swatch player={ player } />
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="max-w-full truncate font-semibold">
						{ seat.name }
					</span>
					{ seat.kind === 'remote' && (
						<span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
							<span
								aria-hidden="true"
								className={ clsx(
									'size-2 rounded-full',
									online
										? 'bg-success'
										: 'border border-control'
								) }
							/>
							{ online ? 'online' : 'offline' }
						</span>
					) }
					{ toMove && (
						<span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-ink">
							To move
						</span>
					) }
				</div>
				{ ! compact && (
					<div className="text-sm text-muted tabular-nums">
						{ pips } pips
					</div>
				) }
			</div>
			{ compact && (
				<span className="shrink-0 text-sm text-muted tabular-nums">
					{ pips } pips
				</span>
			) }
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
					{ score }{ ' ' }
					<span className="text-sm font-normal text-muted">
						/ { target }
					</span>
				</div>
				{ ! compact && <div className="text-xs text-muted">score</div> }
			</div>
		</section>
	);
};
