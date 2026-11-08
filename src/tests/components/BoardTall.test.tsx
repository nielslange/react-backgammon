import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Board } from '../../components/Board';
import { BoardSvg } from '../../components/board/BoardSvg';
import { makeStore } from '../../data/createStore';
import { loadSnapshot, newGame } from '../../data/gameSlice';
import { backgammon } from '../../engine/backgammon';
import { P1, P2, pos } from '../engine/fixtures';

describe( 'the tall board', () => {
	it( 'draws at the given height with a tap area for every column', () => {
		const onColumnClick = vi.fn();
		const { container } = render(
			<BoardSvg
				height={ 1600 }
				checkers={ backgammon.initialCheckers() }
				highlights={ [] }
				selected={ null }
				onCheckerClick={ () => {} }
				onLaneClick={ () => {} }
				onColumnClick={ onColumnClick }
			/>
		);
		expect( container.querySelector( 'svg' ) ).toHaveAttribute( 'viewBox', '0 0 1000 1600' );
		expect( container.querySelectorAll( '[data-column]' ) ).toHaveLength( 24 );
		fireEvent.click( container.querySelector( '[data-column="9"]' )! );
		expect( onColumnClick ).toHaveBeenCalledWith( 9 );
	} );
} );

describe( 'tapping a column', () => {
	const setup = () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch(
			loadSnapshot( {
				snapshot: {
					...store.getState().game.state,
					checkers: pos( [
						{ player: P1, lane: 13, count: 2 },
						{ player: P1, lane: 25, count: 13 },
						{ player: P2, lane: 24, count: 2 },
						{ player: P2, lane: 0, count: 13 },
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
				<Board height={ 1600 } />
			</Provider>
		);
		return { store, view };
	};

	it( 'picks the top checker of an own point, then moves to the tapped column', () => {
		const { store, view } = setup();
		act( () => {
			fireEvent.click( view.container.querySelector( '[data-column="13"]' )! );
		} );
		const preview = store.getState().ui.preview;
		expect( preview?.options.map( ( o ) => o.to ).sort() ).toEqual( [ 11, 9 ].sort() );
		act( () => {
			fireEvent.click( view.container.querySelector( '[data-column="9"]' )! );
		} );
		expect( store.getState().game.state.checkers.filter( ( c ) => c.player === P1 && c.lane === 9 ) ).toHaveLength( 1 );
	} );

	it( 'ignores a tap on an empty column when nothing is selected', () => {
		const { store, view } = setup();
		act( () => {
			fireEvent.click( view.container.querySelector( '[data-column="5"]' )! );
		} );
		expect( store.getState().ui.preview ).toBeNull();
		expect( store.getState().game.state.turnSteps ).toHaveLength( 0 );
	} );
} );
