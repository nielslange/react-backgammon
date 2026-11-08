import { describe, expect, it } from 'vitest';
import {
	BAR_X,
	CHECKER_R,
	POINT_H,
	VIEWBOX,
	barCenter,
	checkerCenter,
	laneAt,
	offSlot,
	pointPolygon,
	pointRect,
} from '../../ui/boardGeometry';
import { P1, P2 } from '../engine/fixtures';

const lanes = Array.from( { length: 24 }, ( _, i ) => i + 1 );
const inside = ( { x, y }: { x: number; y: number } ) =>
	x >= 0 && x <= VIEWBOX.w && y >= 0 && y <= VIEWBOX.h;

describe( 'boardGeometry', () => {
	it( 'puts lanes 1-12 on the bottom and 13-24 on the top', () => {
		for ( const lane of lanes ) {
			const { y } = pointRect( lane );
			if ( lane <= 12 ) expect( y ).toBeGreaterThan( VIEWBOX.h / 2 - 1 );
			else expect( y ).toBeLessThan( VIEWBOX.h / 2 );
		}
	} );

	it( 'orders the bottom row 12..7 | 6..1 and the top row 13..18 | 19..24 left to right', () => {
		const x = ( l: number ) => pointRect( l ).x;
		for ( let l = 12; l > 1; l-- ) expect( x( l ) ).toBeLessThan( x( l - 1 ) );
		for ( let l = 13; l < 24; l++ ) expect( x( l ) ).toBeLessThan( x( l + 1 ) );
		expect( x( 13 ) ).toBe( x( 12 ) );
		expect( x( 24 ) ).toBe( x( 1 ) );
	} );

	it( 'places points 6/7 and 18/19 on either side of the bar', () => {
		expect( pointRect( 7 ).x + pointRect( 7 ).w ).toBeLessThanOrEqual( BAR_X.from );
		expect( pointRect( 6 ).x ).toBeGreaterThanOrEqual( BAR_X.to );
		expect( pointRect( 18 ).x + pointRect( 18 ).w ).toBeLessThanOrEqual( BAR_X.from );
		expect( pointRect( 19 ).x ).toBeGreaterThanOrEqual( BAR_X.to );
	} );

	it( 'draws each point as a triangle pointing to the middle', () => {
		const top = pointPolygon( 13 ).split( ' ' ).map( ( p ) => p.split( ',' ).map( Number ) );
		expect( top ).toHaveLength( 3 );
		expect( top[ 2 ][ 1 ] - top[ 0 ][ 1 ] ).toBeCloseTo( POINT_H );
		const bottom = pointPolygon( 1 ).split( ' ' ).map( ( p ) => p.split( ',' ).map( Number ) );
		expect( bottom[ 0 ][ 1 ] - bottom[ 2 ][ 1 ] ).toBeCloseTo( POINT_H );
	} );

	it( 'stacks checkers from the edge towards the middle without overlap up to five', () => {
		const a = checkerCenter( 1, 0, 5 );
		const b = checkerCenter( 1, 1, 5 );
		expect( a.y - b.y ).toBeCloseTo( 2 * CHECKER_R );
		const t0 = checkerCenter( 24, 0, 2 );
		const t1 = checkerCenter( 24, 1, 2 );
		expect( t1.y - t0.y ).toBeCloseTo( 2 * CHECKER_R );
	} );

	it( 'compresses tall stacks so all checkers stay on their point', () => {
		const rect = pointRect( 1 );
		for ( let i = 0; i < 15; i++ ) {
			const { y } = checkerCenter( 1, i, 15 );
			expect( y - CHECKER_R ).toBeGreaterThanOrEqual( rect.y - 0.001 );
			expect( y + CHECKER_R ).toBeLessThanOrEqual( rect.y + rect.h + 0.001 );
		}
	} );

	it( 'round-trips every checker position through laneAt', () => {
		for ( const lane of lanes ) {
			for ( const [ i, n ] of [ [ 0, 1 ], [ 4, 5 ], [ 14, 15 ] ] ) {
				expect( laneAt( checkerCenter( lane, i, n ) ) ).toBe( lane );
			}
		}
	} );

	it( 'keeps bar checkers on the bar, P2 above the middle and P1 below', () => {
		for ( let i = 0; i < 15; i++ ) {
			const top = barCenter( P2, i, 15 );
			const bottom = barCenter( P1, i, 15 );
			expect( top.x ).toBeCloseTo( ( BAR_X.from + BAR_X.to ) / 2 );
			expect( top.y ).toBeLessThan( VIEWBOX.h / 2 );
			expect( bottom.y ).toBeGreaterThan( VIEWBOX.h / 2 );
			expect( inside( top ) && inside( bottom ) ).toBe( true );
		}
		expect( laneAt( barCenter( P1, 0, 1 ) ) ).toBeNull();
	} );

	it( 'stacks borne-off checkers in the tray, P2 top and P1 bottom, and maps trays to off lanes', () => {
		const p2 = offSlot( P2, 14 );
		const p1 = offSlot( P1, 14 );
		expect( p2.y + p2.h ).toBeLessThan( VIEWBOX.h / 2 );
		expect( p1.y ).toBeGreaterThan( VIEWBOX.h / 2 );
		expect( laneAt( { x: p2.x + p2.w / 2, y: p2.y + p2.h / 2 } ) ).toBe( 0 );
		expect( laneAt( { x: p1.x + p1.w / 2, y: p1.y + p1.h / 2 } ) ).toBe( 25 );
	} );

	it( 'returns null outside the playing area', () => {
		expect( laneAt( { x: 2, y: 2 } ) ).toBeNull();
		expect( laneAt( { x: -10, y: 300 } ) ).toBeNull();
	} );
} );

describe( 'a tall board (phones in portrait)', () => {
	it( 'keeps the standard board when no height is given', async () => {
		const { makeGeometry, VIEWBOX: standard, POINT_H } = await import( '../../ui/boardGeometry' );
		const g = makeGeometry();
		expect( g.VIEWBOX ).toEqual( standard );
		expect( g.POINT_H ).toBe( POINT_H );
	} );

	it( 'stretches the points into long columns with room for the dice in the middle', async () => {
		const { makeGeometry, CHECKER_R } = await import( '../../ui/boardGeometry' );
		const g = makeGeometry( 1600 );
		expect( g.VIEWBOX ).toEqual( { w: 1000, h: 1600 } );
		expect( g.POINT_H ).toBeGreaterThan( 500 );
		const band = g.VIEWBOX.h - 2 * g.FRAME - 2 * g.POINT_H;
		expect( band ).toBeGreaterThanOrEqual( 300 );
		// Five checkers sit side by side without overlapping, as on the standard board.
		const a = g.checkerCenter( 6, 0, 5 );
		const b = g.checkerCenter( 6, 1, 5 );
		expect( Math.abs( a.y - b.y ) ).toBe( 2 * CHECKER_R );
		for ( let lane = 1; lane <= 24; lane++ ) {
			const c = g.checkerCenter( lane, 2, 5 );
			expect( g.laneAt( c ) ).toBe( lane );
		}
	} );

	it( 'maps a tap anywhere in a column, up to the middle, to that point', async () => {
		const { makeGeometry } = await import( '../../ui/boardGeometry' );
		const g = makeGeometry( 1600 );
		const r = g.pointRect( 13 );
		// Below the tip of the triangle but above the middle: still point 13.
		expect( g.laneAt( { x: r.x + r.w / 2, y: g.VIEWBOX.h / 2 - 10 } ) ).toBe( 13 );
		expect( g.laneAt( { x: r.x + r.w / 2, y: g.VIEWBOX.h / 2 + 10 } ) ).toBe( 12 );
		expect( g.columnRect( 13 ) ).toEqual( { x: r.x, y: g.FRAME, w: r.w, h: g.VIEWBOX.h / 2 - g.FRAME } );
	} );

	it( 'converts screen positions when the board is letterboxed in its box', async () => {
		const { toViewBox } = await import( '../../ui/boardGeometry' );
		// A 1000x1600 board drawn in a 400x800 box: scale 0.4, 80 px empty above and below.
		const viewBox = { w: 1000, h: 1600 };
		const rect = { left: 0, top: 0, width: 400, height: 800 };
		expect( toViewBox( 200, 400, rect, viewBox ) ).toEqual( { x: 500, y: 800 } );
		expect( toViewBox( 0, 80, rect, viewBox ) ).toEqual( { x: 0, y: 0 } );
		expect( toViewBox( 400, 720, rect, viewBox ) ).toEqual( { x: 1000, y: 1600 } );
		const wide = { left: 0, top: 0, width: 500, height: 400 };
		expect( toViewBox( 250, 200, wide, viewBox ) ).toEqual( { x: 500, y: 800 } );
	} );
} );

describe( 'a tall stack on the bar', () => {
	it( 'keeps every remaining checker in place when one leaves', async () => {
		const { barCenter, makeGeometry } = await import( '../../ui/boardGeometry' );
		// Above what fits uncompressed (5 on the standard board, 12 on a tall one).
		for ( const [ g, fits ] of [ [ { barCenter }, 5 ], [ makeGeometry( 1600 ), 12 ] ] as const ) {
			for ( let total = 15; total - 1 > fits; total-- ) {
				for ( let i = 0; i < total - 1; i++ ) {
					expect( g.barCenter( P1, i, total - 1 ) ).toEqual( g.barCenter( P1, i, total ) );
				}
			}
		}
	} );

	it( 'still spreads a short stack out fully', async () => {
		const { barCenter, CHECKER_R } = await import( '../../ui/boardGeometry' );
		expect( Math.abs( barCenter( P2, 1, 3 ).y - barCenter( P2, 0, 3 ).y ) ).toBe( 2 * CHECKER_R );
	} );
} );
