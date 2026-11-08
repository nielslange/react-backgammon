import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { DiceTray } from '../../components/DiceTray';
import { Die } from '../../components/Die';
import { PlayerCard } from '../../components/PlayerCard';
import { makeStore } from '../../data/createStore';
import { loadSnapshot, newGame, openingRoll } from '../../data/gameSlice';
import { configureSession, gameEnded } from '../../data/sessionSlice';
import { setMode } from '../../data/uiSlice';
import { P1, P2, pos } from '../engine/fixtures';

const withProvider = ( store: ReturnType< typeof makeStore >, ui: React.ReactNode ) =>
	render( <Provider store={ store }>{ ui }</Provider> );

const moving = ( dice: number[], roll: [ number, number ] ) => {
	const store = makeStore();
	store.dispatch( newGame( { variant: 'backgammon' } ) );
	store.dispatch(
		loadSnapshot( {
			snapshot: {
				...store.getState().game.state,
				checkers: pos( [
					{ player: P1, lane: 13, count: 2 },
					{ player: P1, lane: 25, count: 13 },
					{ player: P2, lane: 12, count: 15 },
				] ),
				phase: 'moving',
				player: P1,
				firstMover: P1,
				roll,
				dice,
			},
		} )
	);
	return store;
};

describe( 'Die', () => {
	it( 'draws the right number of pips and names its value', () => {
		const { container } = render( <Die value={ 5 } /> );
		expect( screen.getByRole( 'img', { name: 'Die showing 5' } ) ).toBeInTheDocument();
		expect( container.querySelectorAll( '[data-pip]' ) ).toHaveLength( 5 );
	} );
} );

describe( 'DiceTray', () => {
	it( 'shows four dice for a double, used ones marked', () => {
		const store = moving( [ 3, 3 ], [ 3, 3 ] );
		withProvider( store, <DiceTray /> );
		const dice = screen.getAllByRole( 'img', { name: /^Die showing 3/ } );
		expect( dice ).toHaveLength( 4 );
		expect( dice.filter( ( d ) => d.getAttribute( 'aria-disabled' ) === 'true' ) ).toHaveLength( 2 );
	} );

	it( 'marks a die that cannot be played as disabled', () => {
		// P1 only on 13 with dice 6-1: 13-6=7 is blocked, 13-1=12 is open.
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch(
			loadSnapshot( {
				snapshot: {
					...store.getState().game.state,
					checkers: pos( [
						{ player: P1, lane: 13, count: 1 },
						{ player: P1, lane: 25, count: 14 },
						{ player: P2, lane: 7, count: 2 },
						{ player: P2, lane: 20, count: 13 },
					] ),
					phase: 'moving',
					player: P1,
					firstMover: P1,
					roll: [ 6, 1 ],
					dice: [ 6, 1 ],
				},
			} )
		);
		withProvider( store, <DiceTray /> );
		expect( screen.getByRole( 'img', { name: /Die showing 6/ } ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByRole( 'img', { name: /Die showing 1/ } ) ).not.toHaveAttribute( 'aria-disabled' );
	} );

	it( 'lets the player pick a die in advanced mode', async () => {
		const store = moving( [ 5, 2 ], [ 5, 2 ] );
		store.dispatch( setMode( 'advanced' ) );
		withProvider( store, <DiceTray /> );
		await userEvent.click( screen.getByRole( 'button', { name: /play the 2/i } ) );
		expect( store.getState().ui.selectedDie ).toBe( 2 );
		expect( screen.getByRole( 'button', { name: /play the 2/i } ) ).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	it( 'says who is rolling while no dice are on the table', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		withProvider( store, <DiceTray /> );
		expect( screen.getByText( /waiting for the opening roll/i ) ).toBeInTheDocument();
	} );
} );

describe( 'DiceTray in Triktrak', () => {
	const triktrakMoving = ( dice: number[], roll: [ number, number ] ) => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'triktrak' } ) );
		store.dispatch(
			loadSnapshot( {
				snapshot: { ...store.getState().game.state, phase: 'moving', player: P1, firstMover: P1, roll, dice },
			} )
		);
		return store;
	};

	it( 'shows all eight dice of a tric trac and marks the next one', () => {
		const store = triktrakMoving( [ 1, 1, 2, 2, 5, 5, 6, 6 ], [ 1, 2 ] );
		withProvider( store, <DiceTray /> );
		const dice = screen.getAllByRole( 'img', { name: /^Die showing/ } );
		expect( dice ).toHaveLength( 8 );
		expect( dice[ 0 ] ).toHaveAccessibleName( 'Die showing 1, next' );
		// Later dice are waiting their turn, not blocked.
		expect( dice.filter( ( d ) => d.getAttribute( 'aria-disabled' ) === 'true' ) ).toHaveLength( 0 );
	} );

	it( 'in advanced mode offers no die buttons, since the order is fixed', () => {
		const store = triktrakMoving( [ 1, 1, 2, 2, 5, 5, 6, 6 ], [ 1, 2 ] );
		store.dispatch( setMode( 'advanced' ) );
		withProvider( store, <DiceTray /> );
		expect( screen.queryAllByRole( 'button', { name: /play the/i } ) ).toHaveLength( 0 );
		expect( screen.getAllByRole( 'img', { name: /^Die showing/ } )[ 0 ] ).toHaveAccessibleName( 'Die showing 1, next' );
	} );
} );

describe( 'PlayerCard', () => {
	const setup = () => {
		const store = makeStore();
		store.dispatch(
			configureSession( {
				players: {
					[ P1 ]: { kind: 'human', name: 'Niels' },
					[ P2 ]: { kind: 'human', name: 'Guest' },
				},
				matchTarget: 5,
			} )
		);
		store.dispatch( gameEnded( { winner: P2, points: 2 } ) );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
		return store;
	};

	it( 'shows name, pips and match score', () => {
		const store = setup();
		withProvider( store, <PlayerCard player={ P2 } /> );
		const card = screen.getByRole( 'region', { name: 'Guest' } );
		expect( card ).toHaveTextContent( '167 pips' );
		expect( card ).toHaveTextContent( '2 / 5' );
	} );

	it( 'marks the player to move', () => {
		const store = setup();
		withProvider(
			store,
			<>
				<PlayerCard player={ P1 } />
				<PlayerCard player={ P2 } />
			</>
		);
		expect( screen.getByRole( 'region', { name: 'Niels' } ) ).toHaveAttribute( 'data-to-move', 'true' );
		expect( screen.getByRole( 'region', { name: 'Guest' } ) ).not.toHaveAttribute( 'data-to-move' );
		expect( screen.getByRole( 'region', { name: 'Niels' } ) ).toHaveTextContent( /to move/i );
	} );

	it( 'shows the cube on the card of its owner', () => {
		const store = setup();
		store.dispatch(
			loadSnapshot( {
				snapshot: { ...store.getState().game.state, cube: { value: 4, owner: P2, offered: false } },
			} )
		);
		withProvider( store, <PlayerCard player={ P2 } /> );
		expect( screen.getByLabelText( 'Doubling cube at 4' ) ).toBeInTheDocument();
	} );
} );
