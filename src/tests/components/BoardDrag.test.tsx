import { describe, expect, it, beforeEach } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Board } from '../../components/Board';
import { makeStore } from '../../data/createStore';
import { loadSnapshot, newGame } from '../../data/gameSlice';
import { checkerCenter, toViewBox, VIEWBOX } from '../../ui/boardGeometry';
import { P1, P2, pos } from '../engine/fixtures';

/** The SVG is drawn 1:1 at the page origin, so client == viewBox coordinates. */
beforeEach( () => {
	SVGElement.prototype.getBoundingClientRect = () =>
		( { left: 0, top: 0, width: VIEWBOX.w, height: VIEWBOX.h, right: VIEWBOX.w, bottom: VIEWBOX.h, x: 0, y: 0, toJSON: () => ( {} ) } ) as DOMRect;
} );

const setup = () => {
	const store = makeStore();
	store.dispatch( newGame( { variant: 'backgammon' } ) );
	store.dispatch(
		loadSnapshot( {
			snapshot: {
				...store.getState().game.state,
				checkers: pos( [
					{ player: P1, lane: 13, count: 1 },
					{ player: P1, lane: 25, count: 14 },
					{ player: P2, lane: 1, count: 1 },
					{ player: P2, lane: 0, count: 14 },
				] ),
				phase: 'moving',
				player: P1,
				firstMover: P1,
				roll: [ 4, 2 ],
				dice: [ 4, 2 ],
			},
		} )
	);
	const view = render(
		<Provider store={ store }>
			<Board />
		</Provider>
	);
	const checker = view.container.querySelector( '[data-checker="1"]' )!;
	return { store, checker };
};

const drag = ( checker: Element, to: { x: number; y: number } ) => {
	const from = checkerCenter( 13, 0, 1 );
	act( () => {
		fireEvent.pointerDown( checker, { clientX: from.x, clientY: from.y, button: 0, pointerId: 1 } );
		fireEvent.pointerMove( window, { clientX: ( from.x + to.x ) / 2, clientY: ( from.y + to.y ) / 2, pointerId: 1 } );
		fireEvent.pointerMove( window, { clientX: to.x, clientY: to.y, pointerId: 1 } );
		fireEvent.pointerUp( window, { clientX: to.x, clientY: to.y, pointerId: 1 } );
	} );
};

describe( 'board drag and drop', () => {
	it( 'toViewBox scales client coordinates into the viewBox', () => {
		const rect = { left: 10, top: 20, width: 500, height: 360 } as DOMRect;
		expect( toViewBox( 260, 200, rect ) ).toEqual( { x: 500, y: 360 } );
	} );

	it( 'dragging from 13 to 9 with a 4 plays the step', () => {
		const { store, checker } = setup();
		drag( checker, checkerCenter( 9, 0, 1 ) );
		expect( store.getState().game.state.checkers.find( ( c ) => c.id === 1 )?.lane ).toBe( 9 );
		expect( store.getState().game.state.dice ).toEqual( [ 2 ] );
	} );

	it( 'dropping on an illegal lane leaves the checker where it was', () => {
		const { store, checker } = setup();
		drag( checker, checkerCenter( 10, 0, 1 ) );
		expect( store.getState().game.state.checkers.find( ( c ) => c.id === 1 )?.lane ).toBe( 13 );
		expect( store.getState().game.state.dice ).toEqual( [ 4, 2 ] );
	} );

	it( 'shows the landing points while dragging', () => {
		const { checker } = setup();
		const from = checkerCenter( 13, 0, 1 );
		act( () => {
			fireEvent.pointerDown( checker, { clientX: from.x, clientY: from.y, button: 0, pointerId: 1 } );
			fireEvent.pointerMove( window, { clientX: from.x + 40, clientY: from.y + 40, pointerId: 1 } );
		} );
		expect( document.querySelector( '[data-target="9"]' ) ).toBeInTheDocument();
		expect( document.querySelector( '[data-target="11"]' ) ).toBeInTheDocument();
		act( () => {
			fireEvent.pointerUp( window, { clientX: from.x + 40, clientY: from.y + 40, pointerId: 1 } );
		} );
	} );
} );

describe( 'board drag robustness', () => {
	it( 'a cancelled drag clears the ghost and the preview and never drops later', () => {
		const { store, checker } = setup();
		const from = checkerCenter( 13, 0, 1 );
		const to = checkerCenter( 9, 0, 1 );
		act( () => {
			fireEvent.pointerDown( checker, { clientX: from.x, clientY: from.y, button: 0, pointerId: 1 } );
			fireEvent.pointerMove( window, { clientX: to.x, clientY: to.y, pointerId: 1 } );
			fireEvent.pointerCancel( window, { pointerId: 1 } );
		} );
		expect( document.querySelector( '[data-checker="1"]' )?.getAttribute( 'style' ) ).toContain(
			`translate(${ from.x }px, ${ from.y }px)`
		);
		expect( store.getState().ui.preview ).toBeNull();
		act( () => {
			fireEvent.pointerUp( window, { clientX: to.x, clientY: to.y, pointerId: 1 } );
		} );
		expect( store.getState().game.state.checkers.find( ( c ) => c.id === 1 )?.lane ).toBe( 13 );
	} );

	it( 'ignores a second pointer while one drag is running', () => {
		const { store, checker } = setup();
		const from = checkerCenter( 13, 0, 1 );
		const to = checkerCenter( 9, 0, 1 );
		act( () => {
			fireEvent.pointerDown( checker, { clientX: from.x, clientY: from.y, button: 0, pointerId: 1 } );
			fireEvent.pointerMove( window, { clientX: to.x, clientY: to.y, pointerId: 1 } );
			fireEvent.pointerUp( window, { clientX: to.x, clientY: to.y, pointerId: 2 } );
		} );
		expect( store.getState().game.state.checkers.find( ( c ) => c.id === 1 )?.lane ).toBe( 13 );
		act( () => {
			fireEvent.pointerUp( window, { clientX: to.x, clientY: to.y, pointerId: 1 } );
		} );
		expect( store.getState().game.state.checkers.find( ( c ) => c.id === 1 )?.lane ).toBe( 9 );
	} );

	it( 'treats a few pixels of finger jitter as a tap, measured in screen pixels', () => {
		// Board drawn at phone size: 358 px wide, so 1 screen px ≈ 2.8 viewBox units.
		SVGElement.prototype.getBoundingClientRect = () =>
			( { left: 0, top: 0, width: 358, height: 257.76, right: 358, bottom: 257.76, x: 0, y: 0, toJSON: () => ( {} ) } ) as DOMRect;
		const { store, checker } = setup();
		const from = checkerCenter( 13, 0, 1 );
		const scale = 358 / VIEWBOX.w;
		act( () => {
			fireEvent.pointerDown( checker, { clientX: from.x * scale, clientY: from.y * scale, button: 0, pointerId: 1 } );
			fireEvent.pointerMove( window, { clientX: from.x * scale + 4, clientY: from.y * scale, pointerId: 1 } );
			fireEvent.pointerUp( window, { clientX: from.x * scale + 4, clientY: from.y * scale, pointerId: 1 } );
		} );
		// No drag happened, so no preview was opened by the drag path.
		expect( store.getState().ui.preview ).toBeNull();
	} );
} );

describe( 'board keyboard access', () => {
	it( 'exposes the board as a labelled group with focusable movable checkers', () => {
		setup();
		const container = document.body;
		expect( container.querySelector( 'svg' ) ).toHaveAttribute( 'role', 'group' );
		const checker = container.querySelector( '[data-checker="1"]' )!;
		expect( checker ).toHaveAttribute( 'tabindex', '0' );
		expect( checker ).toHaveAttribute( 'role', 'button' );
		expect( checker ).toHaveAttribute( 'aria-label', 'Light checker on point 13' );
		expect( container.querySelector( '[data-checker="2"]' ) ).not.toHaveAttribute( 'tabindex' );
	} );

	it( 'moves a checker with Enter on the checker and Enter on a landing point', () => {
		const { store } = setup();
		const container = document.body;
		const checker = container.querySelector< SVGGElement >( '[data-checker="1"]' )!;
		act( () => {
			checker.focus();
			fireEvent.keyDown( checker, { key: 'Enter' } );
		} );
		const target = container.querySelector< SVGGElement >( '[data-target="9"]' )!;
		expect( target ).toHaveAttribute( 'role', 'button' );
		expect( target ).toHaveAttribute( 'aria-label', 'Move to point 9 with the 4' );
		act( () => {
			fireEvent.keyDown( target, { key: ' ' } );
		} );
		expect( store.getState().game.state.checkers.find( ( c ) => c.id === 1 )?.lane ).toBe( 9 );
	} );
} );
