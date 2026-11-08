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
