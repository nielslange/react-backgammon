'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../data/store';
import { PlayerType } from '../types/PlayerType';
import { BAR_X, FRAME, makeGeometry } from '../ui/boardGeometry';
import { useBoxSize } from '../ui/useBoxSize';
import {
	PHONE_LANDSCAPE,
	PHONE_PORTRAIT,
	useMediaQuery,
} from '../ui/useMediaQuery';
import { Board } from './Board';
import { ActionBar } from './ActionBar';
import { CubeDialog } from './CubeDialog';
import { DiceTray, ModeSwitch } from './DiceTray';
import { GameOverDialog } from './GameOverDialog';
import { PlayerCard } from './PlayerCard';
import { Toast } from './Toast';

const SetUpLink = () => (
	<Link
		href="/"
		className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-4 font-medium text-accent-ink sm:min-h-10"
	>
		Set up a game
	</Link>
);

/** Percent of `total`, for placing HTML over the SVG board. */
const pct = ( value: number, total: number ) => `${ ( value / total ) * 100 }%`;

/**
 * Phones held upright: slim player strips, and a board that fills the
 * height between them so every point becomes a long column. The dice lie
 * in the middle band of the mover's half, the notice in the other half.
 */
const PhoneGame = ( { idle }: { idle: boolean } ) => {
	const boxRef = useRef< HTMLDivElement >( null );
	const box = useBoxSize( boxRef );
	const mover =
		useSelector( ( root: RootState ) => root.game.state.player ) ??
		PlayerType.PLAYER_ONE;
	// The viewBox takes the box's shape, so the board fills it exactly.
	const height = box && box.w > 0 ? ( 1000 * box.h ) / box.w : undefined;
	const g = makeGeometry( height );
	const bandTop = FRAME + g.POINT_H;
	const bandH = g.VIEWBOX.h - 2 * bandTop;
	const halfW = BAR_X.from - FRAME;
	const halves = { left: FRAME, right: BAR_X.to };
	const diceSide = mover === PlayerType.PLAYER_ONE ? 'right' : 'left';
	const noticeSide = diceSide === 'right' ? 'left' : 'right';
	const overlay = ( side: 'left' | 'right' ) => ( {
		left: pct( halves[ side ], 1000 ),
		width: pct( halfW, 1000 ),
		top: pct( bandTop, g.VIEWBOX.h ),
		height: pct( bandH, g.VIEWBOX.h ),
	} );

	return (
		<div data-layout="phone" className="game flex flex-1 flex-col gap-2">
			<PlayerCard player={ PlayerType.PLAYER_TWO } compact />
			<div
				ref={ boxRef }
				data-board-box
				className="relative min-h-72 flex-1 overflow-hidden rounded-[18px] shadow-board"
			>
				<Board
					height={ height }
					className="absolute inset-0 block h-full w-full"
				/>
				<div
					data-dice-overlay
					data-side={ diceSide }
					className="pointer-events-none absolute flex items-center justify-center p-1"
					style={ overlay( diceSide ) }
				>
					{ ! idle && (
						<DiceTray className="pointer-events-auto justify-center" />
					) }
				</div>
				<div
					className="pointer-events-none absolute flex items-center justify-center p-1"
					style={ overlay( noticeSide ) }
				>
					<Toast className="pointer-events-auto w-full" />
				</div>
			</div>
			<PlayerCard player={ PlayerType.PLAYER_ONE } compact />
			{ idle ? <SetUpLink /> : <ActionBar extra={ <ModeSwitch /> } /> }
			<CubeDialog />
			<GameOverDialog />
		</div>
	);
};

/**
 * Phones held sideways: the board fills the height on the left (standard
 * shape, centred), a narrow column on the right holds everything else.
 */
const PhoneLandscapeGame = ( { idle }: { idle: boolean } ) => (
	<div
		data-layout="phone-landscape"
		className="game flex min-h-0 flex-1 gap-3"
	>
		<div data-board-box className="relative min-w-0 flex-1">
			<Board className="absolute inset-0 block h-full w-full" />
		</div>
		<div
			data-side-column
			className="flex w-80 shrink-0 flex-col gap-2 overflow-y-auto"
		>
			<PlayerCard player={ PlayerType.PLAYER_TWO } compact />
			{ idle ? <SetUpLink /> : <DiceTray /> }
			<Toast />
			{ ! idle && <ActionBar extra={ <ModeSwitch /> } /> }
			<PlayerCard
				player={ PlayerType.PLAYER_ONE }
				compact
				className="mt-auto"
			/>
		</div>
		<CubeDialog />
		<GameOverDialog />
	</div>
);

/**
 * The game screen. On wide screens the board sits left and the right
 * column mirrors it: Dark's card on top, the dice and actions in the
 * middle, Light's card at the bottom. Phones in portrait get PhoneGame.
 */
export const Game = () => {
	const idle = useSelector(
		( root: RootState ) => root.game.state.phase === 'idle'
	);
	const phone = useMediaQuery( PHONE_PORTRAIT );
	const sideways = useMediaQuery( PHONE_LANDSCAPE );
	// Unknown until hydrated: draw nothing rather than a layout that jumps.
	if ( phone === null || sideways === null ) {
		return <div data-layout="pending" className="flex-1" />;
	}
	if ( phone ) return <PhoneGame idle={ idle } />;
	if ( sideways ) return <PhoneLandscapeGame idle={ idle } />;

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
