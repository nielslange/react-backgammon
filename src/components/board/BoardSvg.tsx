'use client';

import { useId, type PointerEvent as ReactPointerEvent } from 'react';
import type { Checker, Player } from '../../engine/types';
import { PlayerType } from '../../types/PlayerType';
import {
	BAR_X,
	CHECKER_R,
	FRAME,
	TRAY_X,
	VIEWBOX,
	barCenter,
	checkerCenter,
	offSlot,
	pointPolygon,
	pointRect,
	trayRect,
	type Rect,
} from '../../ui/boardGeometry';

export type BoardSvgProps = {
	checkers: Checker[];
	/** Lanes that are legal landing points right now. */
	highlights: number[];
	/** Id of the checker whose moves are being previewed. */
	selected: number | null;
	onCheckerClick: ( id: number ) => void;
	onLaneClick: ( lane: number ) => void;
	/** Start of a drag on a checker (Task 17). */
	onCheckerPointerDown?: ( id: number, event: ReactPointerEvent< SVGGElement > ) => void;
	/** Checker currently being dragged and where it is. */
	drag?: { id: number; x: number; y: number } | null;
	svgRef?: React.Ref< SVGSVGElement >;
};

const LANES = Array.from( { length: 24 }, ( _, i ) => i + 1 );
const BAR_LANE: Record< Player, number > = {
	[ PlayerType.PLAYER_ONE ]: 0,
	[ PlayerType.PLAYER_TWO ]: 25,
};
const COLOUR_NAME: Record< Player, string > = {
	[ PlayerType.PLAYER_ONE ]: 'light',
	[ PlayerType.PLAYER_TWO ]: 'dark',
};

type Placed = {
	checker: Checker;
	place: 'point' | 'bar' | 'off';
	x: number;
	y: number;
	slab?: Rect;
	count?: number;
};

/** Where every checker is drawn, in viewBox units. */
const layout = ( checkers: Checker[] ): Placed[] => {
	const groups = new Map< string, Checker[] >();
	for ( const c of [ ...checkers ].sort( ( a, b ) => a.id - b.id ) ) {
		const key = `${ c.player }:${ c.lane }`;
		groups.set( key, [ ...( groups.get( key ) ?? [] ), c ] );
	}
	const placed: Placed[] = [];
	for ( const group of groups.values() ) {
		const { player, lane } = group[ 0 ];
		group.forEach( ( checker, index ) => {
			if ( lane >= 1 && lane <= 24 ) {
				const { x, y } = checkerCenter( lane, index, group.length );
				const top = index === group.length - 1;
				placed.push( {
					checker,
					place: 'point',
					x,
					y,
					count: top && group.length > 5 ? group.length : undefined,
				} );
			} else if ( lane === BAR_LANE[ player ] ) {
				const { x, y } = barCenter( player, index, group.length );
				placed.push( { checker, place: 'bar', x, y } );
			} else {
				const slab = offSlot( player, index );
				placed.push( {
					checker,
					place: 'off',
					x: slab.x + slab.w / 2,
					y: slab.y + slab.h / 2,
					slab,
				} );
			}
		} );
	}
	return placed;
};

const pointLabel = ( lane: number, checkers: Checker[] ) => {
	const here = checkers.filter( ( c ) => c.lane === lane );
	if ( here.length === 0 ) return `Point ${ lane }, empty`;
	const colour = COLOUR_NAME[ here[ 0 ].player ];
	return `Point ${ lane }, ${ here.length } ${ colour } checker${ here.length === 1 ? '' : 's' }`;
};

/** Area that accepts a click when the lane is a legal landing point. */
const targetRect = ( lane: number ): Rect => {
	if ( lane === 0 ) return trayRect( PlayerType.PLAYER_TWO );
	if ( lane === 25 ) return trayRect( PlayerType.PLAYER_ONE );
	return pointRect( lane );
};

export const BoardSvg = ( {
	checkers,
	highlights,
	selected,
	onCheckerClick,
	onLaneClick,
	onCheckerPointerDown,
	drag = null,
	svgRef,
}: BoardSvgProps ) => {
	const uid = useId().replace( /:/g, '' );
	const id = ( name: string ) => `${ uid }-${ name }`;
	const placed = layout( checkers );

	return (
		<svg
			ref={ svgRef }
			viewBox={ `0 0 ${ VIEWBOX.w } ${ VIEWBOX.h }` }
			role="img"
			aria-label="Backgammon board"
			className="block h-auto w-full touch-none select-none"
		>
			<defs>
				<linearGradient id={ id( 'frame' ) } x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#7a5233" />
					<stop offset="1" stopColor="var(--color-frame)" />
				</linearGradient>
				<radialGradient id={ id( 'felt' ) } cx="0.5" cy="0.45" r="0.75">
					<stop offset="0" stopColor="var(--color-felt)" />
					<stop offset="1" stopColor="var(--color-felt-dark)" />
				</radialGradient>
				<radialGradient id={ id( 'light' ) } cx="0.38" cy="0.32" r="0.75">
					<stop offset="0" stopColor="#fffaf0" />
					<stop offset="0.7" stopColor="var(--color-checker-light)" />
					<stop offset="1" stopColor="#d8c9a8" />
				</radialGradient>
				<radialGradient id={ id( 'dark' ) } cx="0.38" cy="0.32" r="0.75">
					<stop offset="0" stopColor="#4a5867" />
					<stop offset="0.7" stopColor="var(--color-checker-dark)" />
					<stop offset="1" stopColor="#1c242d" />
				</radialGradient>
				<filter id={ id( 'shadow' ) } x="-30%" y="-30%" width="160%" height="160%">
					<feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodOpacity="0.35" />
				</filter>
			</defs>

			{ /* Frame, felt, bar and trays */ }
			<rect width={ VIEWBOX.w } height={ VIEWBOX.h } rx="18" fill={ `url(#${ id( 'frame' ) })` } />
			<rect
				x={ FRAME }
				y={ FRAME }
				width={ TRAY_X.from - 20 - FRAME }
				height={ VIEWBOX.h - 2 * FRAME }
				rx="6"
				fill={ `url(#${ id( 'felt' ) })` }
			/>
			<rect
				x={ BAR_X.from }
				y={ FRAME }
				width={ BAR_X.to - BAR_X.from }
				height={ VIEWBOX.h - 2 * FRAME }
				fill={ `url(#${ id( 'frame' ) })` }
			/>
			{ [ PlayerType.PLAYER_TWO, PlayerType.PLAYER_ONE ].map( ( p ) => {
				const r = trayRect( p );
				return (
					<rect key={ p } x={ r.x } y={ r.y } width={ r.w } height={ r.h } rx="6" fill="#00000033" />
				);
			} ) }

			{ /* Points */ }
			{ LANES.map( ( lane ) => (
				<polygon
					key={ lane }
					data-point={ lane }
					role="img"
					aria-label={ pointLabel( lane, checkers ) }
					points={ pointPolygon( lane ) }
					fill={ lane % 2 === 0 ? 'var(--color-point-light)' : 'var(--color-point-dark)' }
					opacity="0.92"
				/>
			) ) }

			{ /* Landing-point highlights and click targets */ }
			{ highlights.map( ( lane ) => {
				const r = targetRect( lane );
				return (
					<g key={ `t${ lane }` } data-target={ lane } className="cursor-pointer" onClick={ () => onLaneClick( lane ) }>
						{ lane >= 1 && lane <= 24 ? (
							<polygon
								points={ pointPolygon( lane ) }
								fill="var(--color-accent)"
								fillOpacity="0.4"
								stroke="var(--color-accent)"
								strokeWidth="3"
							/>
						) : (
							<rect
								x={ r.x }
								y={ r.y }
								width={ r.w }
								height={ r.h }
								rx="6"
								fill="var(--color-accent)"
								fillOpacity="0.35"
								stroke="var(--color-accent)"
								strokeWidth="3"
							/>
						) }
						<rect x={ r.x } y={ r.y } width={ r.w } height={ r.h } fill="transparent" />
					</g>
				);
			} ) }

			{ /* Checkers, keyed by id so moves animate */ }
			{ placed.map( ( { checker, place, x, y, slab, count } ) => {
				const dragging = drag?.id === checker.id;
				const cx = dragging ? drag.x : x;
				const cy = dragging ? drag.y : y;
				const isSelected = selected === checker.id;
				const fill = `url(#${ id( COLOUR_NAME[ checker.player ] ) })`;
				const edge =
					checker.player === PlayerType.PLAYER_ONE
						? 'var(--color-checker-light-edge)'
						: 'var(--color-checker-dark-edge)';
				return (
					<g
						key={ checker.id }
						data-checker={ checker.id }
						data-player={ checker.player }
						data-place={ place }
						data-selected={ isSelected ? 'true' : undefined }
						className="checker cursor-pointer"
						style={ {
							transform: `translate(${ cx }px, ${ cy }px)`,
							transition: dragging ? 'none' : 'transform 180ms ease-out',
						} }
						onClick={ ( e ) => {
							e.stopPropagation();
							onCheckerClick( checker.id );
						} }
						onPointerDown={ ( e ) => onCheckerPointerDown?.( checker.id, e ) }
					>
						{ place === 'off' && slab ? (
							<rect
								x={ -slab.w / 2 }
								y={ -slab.h / 2 }
								width={ slab.w }
								height={ slab.h }
								rx="4"
								fill={ fill }
								stroke={ edge }
								strokeWidth="1.5"
							/>
						) : (
							<g filter={ `url(#${ id( 'shadow' ) })` }>
								<circle r={ CHECKER_R - 1 } fill={ fill } stroke={ edge } strokeWidth="2" />
								<circle r={ CHECKER_R - 9 } fill="none" stroke={ edge } strokeOpacity="0.45" strokeWidth="1.5" />
							</g>
						) }
						{ isSelected && (
							<circle r={ CHECKER_R + 3 } fill="none" stroke="var(--color-accent)" strokeWidth="4" />
						) }
						{ count !== undefined && (
							<text
								data-count={ count }
								textAnchor="middle"
								dominantBaseline="central"
								fontSize="22"
								fontWeight="700"
								fill={ checker.player === PlayerType.PLAYER_ONE ? '#3a2f1f' : '#f3ead8' }
							>
								{ count }
							</text>
						) }
					</g>
				);
			} ) }
		</svg>
	);
};
