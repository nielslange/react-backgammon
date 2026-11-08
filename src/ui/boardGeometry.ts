/**
 * Board geometry in viewBox units. Pure functions, no React.
 *
 *   ┌frame──────────────────────────────────────────────┐
 *   │ 13 14 15 16 17 18 │bar│ 19 20 21 22 23 24 │ │off P2│
 *   │                   │   │                   │ │      │
 *   │ 12 11 10  9  8  7 │bar│  6  5  4  3  2  1 │ │off P1│
 *   └───────────────────────────────────────────────────┘
 *
 * Bar: P2 (lane 25) above the middle, P1 (lane 0) below.
 * Off trays: P2 (lane 0) top, P1 (lane 25) bottom.
 */
import { PlayerType } from '../types/PlayerType';
import type { Player } from '../engine/types';

export const VIEWBOX = { w: 1000, h: 720 } as const;

export const FRAME = 20;
export const POINT_W = 66;
export const POINT_H = 300;
export const CHECKER_R = 30;

const LEFT_X = FRAME;
export const BAR_X = { from: LEFT_X + 6 * POINT_W, to: LEFT_X + 6 * POINT_W + 60 };
const RIGHT_X = BAR_X.to;
export const TRAY_X = { from: RIGHT_X + 6 * POINT_W + 20, to: VIEWBOX.w - FRAME };
const TOP_Y = FRAME;
const BOTTOM_Y = VIEWBOX.h - FRAME;
const MID_Y = VIEWBOX.h / 2;

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

const isTop = ( lane: number ) => lane >= 13;

/** Column 0..11 from the left edge, skipping the bar. */
const column = ( lane: number ): number => ( isTop( lane ) ? lane - 13 : 12 - lane );

const columnX = ( col: number ): number =>
	col < 6 ? LEFT_X + col * POINT_W : RIGHT_X + ( col - 6 ) * POINT_W;

/** Bounding box of a point's triangle. */
export const pointRect = ( lane: number ): Rect => ( {
	x: columnX( column( lane ) ),
	y: isTop( lane ) ? TOP_Y : BOTTOM_Y - POINT_H,
	w: POINT_W,
	h: POINT_H,
} );

/** Triangle as an SVG `points` string: two base corners, then the tip. */
export const pointPolygon = ( lane: number ): string => {
	const { x, y, w, h } = pointRect( lane );
	return isTop( lane )
		? `${ x },${ y } ${ x + w },${ y } ${ x + w / 2 },${ y + h }`
		: `${ x },${ y + h } ${ x + w },${ y + h } ${ x + w / 2 },${ y }`;
};

/** Distance between stacked checker centres; tight stacks overlap. */
const stackStep = ( total: number, room: number ): number =>
	total <= 1 ? 0 : Math.min( 2 * CHECKER_R, ( room - 2 * CHECKER_R ) / ( total - 1 ) );

/** Centre of the `index`-th checker (0 = at the edge) of `total` on a point. */
export const checkerCenter = ( lane: number, index: number, total: number ): Point => {
	const { x, y, w, h } = pointRect( lane );
	const step = stackStep( total, h );
	const offset = CHECKER_R + index * step;
	return {
		x: x + w / 2,
		y: isTop( lane ) ? y + offset : y + h - offset,
	};
};

/** Centre of a checker on the bar; stacks away from the middle. */
export const barCenter = ( player: Player, index: number, total: number ): Point => {
	const room = MID_Y - TOP_Y - 20;
	const step = stackStep( total, room );
	const offset = 20 + CHECKER_R + index * step;
	return {
		x: ( BAR_X.from + BAR_X.to ) / 2,
		y: player === PlayerType.PLAYER_TWO ? MID_Y - offset : MID_Y + offset,
	};
};

const SLAB_H = 16;
const SLAB_GAP = 2;

/** A borne-off checker drawn as a slab in the player's tray. */
export const offSlot = ( player: Player, index: number ): Rect => {
	const w = TRAY_X.to - TRAY_X.from - 16;
	const x = TRAY_X.from + 8;
	const stride = SLAB_H + SLAB_GAP;
	return player === PlayerType.PLAYER_TWO
		? { x, y: TOP_Y + 6 + index * stride, w, h: SLAB_H }
		: { x, y: BOTTOM_Y - 6 - SLAB_H - index * stride, w, h: SLAB_H };
};

/** The tray rectangle that holds a player's borne-off checkers. */
export const trayRect = ( player: Player ): Rect => {
	const h = MID_Y - TOP_Y - 10;
	return player === PlayerType.PLAYER_TWO
		? { x: TRAY_X.from, y: TOP_Y, w: TRAY_X.to - TRAY_X.from, h }
		: { x: TRAY_X.from, y: BOTTOM_Y - h, w: TRAY_X.to - TRAY_X.from, h };
};

/**
 * The drop target under a viewBox coordinate: a point 1–24, or an off
 * lane for the trays (top 0 = P2 off, bottom 25 = P1 off). The bar and
 * the frame are not targets.
 */
export const laneAt = ( { x, y }: Point ): number | null => {
	if ( y < TOP_Y || y > BOTTOM_Y ) return null;
	const top = y < MID_Y;
	if ( x >= TRAY_X.from && x <= TRAY_X.to ) return top ? 0 : 25;

	let col: number;
	if ( x >= LEFT_X && x < BAR_X.from ) col = Math.floor( ( x - LEFT_X ) / POINT_W );
	else if ( x >= RIGHT_X && x < RIGHT_X + 6 * POINT_W ) col = 6 + Math.floor( ( x - RIGHT_X ) / POINT_W );
	else return null;

	return top ? 13 + col : 12 - col;
};
