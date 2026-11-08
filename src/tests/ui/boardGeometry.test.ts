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
