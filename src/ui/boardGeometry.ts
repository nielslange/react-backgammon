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

export const FRAME = 20;
export const POINT_W = 66;
export const CHECKER_R = 30;
/** The standard (landscape) board height. */
export const STANDARD_H = 720;

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

const LEFT_X = FRAME;
export const BAR_X = {
	from: LEFT_X + 6 * POINT_W,
	to: LEFT_X + 6 * POINT_W + 60,
};
const RIGHT_X = BAR_X.to;
export const TRAY_X = { from: RIGHT_X + 6 * POINT_W + 20, to: 1000 - FRAME };

/** Centre x of the left (P2's side) or right (P1's side) half, for the dice. */
export const HALF_CENTRE_X = {
	left: LEFT_X + 3 * POINT_W,
	right: RIGHT_X + 3 * POINT_W,
};

const isTop = ( lane: number ) => lane >= 13;

/** Column 0..11 from the left edge, skipping the bar. */
const column = ( lane: number ): number =>
	isTop( lane ) ? lane - 13 : 12 - lane;

const columnX = ( col: number ): number =>
	col < 6 ? LEFT_X + col * POINT_W : RIGHT_X + ( col - 6 ) * POINT_W;

/** Distance between stacked checker centres; tight stacks overlap. */
const stackStep = ( total: number, room: number ): number =>
	total <= 1
		? 0
		: Math.min( 2 * CHECKER_R, ( room - 2 * CHECKER_R ) / ( total - 1 ) );

const SLAB_H = 16;
const SLAB_GAP = 2;

/**
 * The board for a given height. The width never changes, so checkers keep
 * their size; a taller board (phones in portrait) gets long points and a
 * wide middle band for the dice.
 */
export const makeGeometry = ( height = STANDARD_H ) => {
	const h = Math.max( STANDARD_H, Math.round( height ) );
	const VIEWBOX = { w: 1000, h } as const;
	const TOP_Y = FRAME;
	const BOTTOM_Y = h - FRAME;
	const MID_Y = h / 2;
	const POINT_H =
		h === STANDARD_H ? 300 : Math.round( ( h - 2 * FRAME ) * 0.4 );

	/** Bounding box of a point's triangle. */
	const pointRect = ( lane: number ): Rect => ( {
		x: columnX( column( lane ) ),
		y: isTop( lane ) ? TOP_Y : BOTTOM_Y - POINT_H,
		w: POINT_W,
		h: POINT_H,
	} );

	/** The whole column of a point, from the edge to the middle: its tap area. */
	const columnRect = ( lane: number ): Rect => ( {
		x: columnX( column( lane ) ),
		y: isTop( lane ) ? TOP_Y : MID_Y,
		w: POINT_W,
		h: MID_Y - TOP_Y,
	} );

	/** Triangle as an SVG `points` string: two base corners, then the tip. */
	const pointPolygon = ( lane: number ): string => {
		const { x, y, w, h: ph } = pointRect( lane );
		return isTop( lane )
			? `${ x },${ y } ${ x + w },${ y } ${ x + w / 2 },${ y + ph }`
			: `${ x },${ y + ph } ${ x + w },${ y + ph } ${ x + w / 2 },${ y }`;
	};

	/** Centre of the `index`-th checker (0 = at the edge) of `total` on a point. */
	const checkerCenter = (
		lane: number,
		index: number,
		total: number
	): Point => {
		const { x, y, w, h: ph } = pointRect( lane );
		const step = stackStep( total, ph );
		const offset = CHECKER_R + index * step;
		return {
			x: x + w / 2,
			y: isTop( lane ) ? y + offset : y + ph - offset,
		};
	};

	/** Centre of a checker on the bar; stacks away from the middle. */
	const barCenter = (
		player: Player,
		index: number,
		total: number
	): Point => {
		const room = MID_Y - TOP_Y - 20;
		const step = stackStep( total, room );
		const offset = 20 + CHECKER_R + index * step;
		return {
			x: ( BAR_X.from + BAR_X.to ) / 2,
			y:
				player === PlayerType.PLAYER_TWO
					? MID_Y - offset
					: MID_Y + offset,
		};
	};

	/** A borne-off checker drawn as a slab in the player's tray. */
	const offSlot = ( player: Player, index: number ): Rect => {
		const w = TRAY_X.to - TRAY_X.from - 16;
		const x = TRAY_X.from + 8;
		const stride = SLAB_H + SLAB_GAP;
		return player === PlayerType.PLAYER_TWO
			? { x, y: TOP_Y + 6 + index * stride, w, h: SLAB_H }
			: { x, y: BOTTOM_Y - 6 - SLAB_H - index * stride, w, h: SLAB_H };
	};

	/** The tray rectangle that holds a player's borne-off checkers. */
	const trayRect = ( player: Player ): Rect => {
		const th = MID_Y - TOP_Y - 10;
		return player === PlayerType.PLAYER_TWO
			? { x: TRAY_X.from, y: TOP_Y, w: TRAY_X.to - TRAY_X.from, h: th }
			: {
					x: TRAY_X.from,
					y: BOTTOM_Y - th,
					w: TRAY_X.to - TRAY_X.from,
					h: th,
				};
	};

	/**
	 * The drop target under a viewBox coordinate: a point 1–24 (its whole
	 * column), or an off lane for the trays (top 0 = P2 off, bottom 25 = P1
	 * off). The bar and the frame are not targets.
	 */
	const laneAt = ( { x, y }: Point ): number | null => {
		if ( y < TOP_Y || y > BOTTOM_Y ) return null;
		const top = y < MID_Y;
		if ( x >= TRAY_X.from && x <= TRAY_X.to ) return top ? 0 : 25;

		let col: number;
		if ( x >= LEFT_X && x < BAR_X.from )
			col = Math.floor( ( x - LEFT_X ) / POINT_W );
		else if ( x >= RIGHT_X && x < RIGHT_X + 6 * POINT_W )
			col = 6 + Math.floor( ( x - RIGHT_X ) / POINT_W );
		else return null;

		return top ? 13 + col : 12 - col;
	};

	return {
		VIEWBOX,
		FRAME,
		POINT_H,
		MID_Y,
		pointRect,
		columnRect,
		pointPolygon,
		checkerCenter,
		barCenter,
		offSlot,
		trayRect,
		laneAt,
	};
};

export type Geometry = ReturnType< typeof makeGeometry >;

/** The standard board, as before. */
const standard = makeGeometry();
export const {
	VIEWBOX,
	POINT_H,
	pointRect,
	columnRect,
	pointPolygon,
	checkerCenter,
	barCenter,
	offSlot,
	trayRect,
	laneAt,
} = standard;

/**
 * Convert a pointer position to viewBox units. The SVG scales the board to
 * fit its box and centres it (preserveAspectRatio "xMidYMid meet"), so a
 * box with another aspect ratio leaves empty strips on two sides.
 */
export const toViewBox = (
	clientX: number,
	clientY: number,
	rect: Pick< DOMRect, 'left' | 'top' | 'width' | 'height' >,
	viewBox: { w: number; h: number } = VIEWBOX
): Point => {
	const scale = Math.min( rect.width / viewBox.w, rect.height / viewBox.h );
	const offsetX = ( rect.width - viewBox.w * scale ) / 2;
	const offsetY = ( rect.height - viewBox.h * scale ) / 2;
	return {
		x: ( clientX - rect.left - offsetX ) / scale,
		y: ( clientY - rect.top - offsetY ) / scale,
	};
};
