import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Board } from '../../components/Board';
import { makeStore } from '../../data/createStore';
import { newGame, openingRoll } from '../../data/gameSlice';
import { pointRect, VIEWBOX } from '../../ui/boardGeometry';
import { P1 } from '../engine/fixtures';

/** The SVG is drawn 1:1 at the page origin, so client == viewBox coordinates. */
beforeEach( () => {
	SVGElement.prototype.getBoundingClientRect = () =>
		( {
			left: 0,
			top: 0,
			width: VIEWBOX.w,
			height: VIEWBOX.h,
			right: VIEWBOX.w,
			bottom: VIEWBOX.h,
			x: 0,
			y: 0,
			toJSON: () => ( {} ),
		} ) as DOMRect;
} );

/** Triktrak, Light to enter with 4-2: all fifteen checkers wait on the bar. */
const setup = () => {
	const store = makeStore();
	store.dispatch( newGame( { variant: 'triktrak' } ) );
	store.dispatch( openingRoll( { p1: 4, p2: 2 } ) );
	const view = render(
		<Provider store={ store }>
			<Board />
		</Provider>
	);
	const bar = () =>
		store
			.getState()
			.game.state.checkers.filter(
				( c ) => c.player === P1 && c.lane === 0
			)
			.map( ( c ) => c.id )
			.sort( ( a, b ) => a - b );
	return { store, view, bar };
};

describe( 'taking a checker from a stack', () => {
	it( 'moves the top checker, whichever checker of the stack was clicked', () => {
		const { store, view, bar } = setup();
		const [ bottom ] = bar();
		const top = bar().at( -1 )!;
		act( () => {
			fireEvent.click(
				view.container.querySelector( `[data-checker="${ bottom }"]` )!
			);
		} );
		// Light enters with the 2 first (lower die): one landing point, so one tap moves.
		const [ step ] = store.getState().game.state.turnSteps;
		expect( step ).toMatchObject( { checkerId: top, from: 0 } );
		// The clicked checker and the rest of the stack stay where they were.
		expect( bar() ).toContain( bottom );
		expect( bar() ).not.toContain( top );
	} );

	it( 'drags the top checker, whichever checker of the stack was grabbed', () => {
		const { store, view, bar } = setup();
		const [ bottom ] = bar();
		const top = bar().at( -1 )!;
		const target = pointRect( 23 );
		act( () => {
			fireEvent.pointerDown(
				view.container.querySelector( `[data-checker="${ bottom }"]` )!,
				{ clientX: 446, clientY: 400, button: 0, pointerId: 1 }
			);
			fireEvent.pointerMove( window, {
				clientX: 500,
				clientY: 300,
				pointerId: 1,
			} );
		} );
		// The checker under the pointer is the stack's top one.
		expect(
			view.container
				.querySelector( `[data-checker="${ top }"]` )
				?.getAttribute( 'style' )
		).toContain( 'transition: none' );
		act( () => {
			fireEvent.pointerMove( window, {
				clientX: target.x + target.w / 2,
				clientY: target.y + 40,
				pointerId: 1,
			} );
			fireEvent.pointerUp( window, {
				clientX: target.x + target.w / 2,
				clientY: target.y + 40,
				pointerId: 1,
			} );
		} );
		expect( store.getState().game.state.turnSteps[ 0 ] ).toMatchObject( {
			checkerId: top,
			to: 23,
		} );
		expect( bar() ).toContain( bottom );
	} );
} );
