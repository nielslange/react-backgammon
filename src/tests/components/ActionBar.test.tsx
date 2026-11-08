import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { ActionBar } from '../../components/ActionBar';
import { CubeDialog } from '../../components/CubeDialog';
import { GameOverDialog } from '../../components/GameOverDialog';
import { makeStore } from '../../data/createStore';
import { newGame, offerDouble, playStep } from '../../data/gameSlice';
import { selectLegalSteps } from '../../data/selectors';
import { configureSession, gameEnded } from '../../data/sessionSlice';
import { scripted } from '../../runtime/rng';
import { createTurnDriver } from '../../runtime/turnDriver';
import type { Player } from '../../engine/types';
import { P1, P2 } from '../engine/fixtures';

const push = vi.fn();
vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push } ) } ) );

const players = {
	[ P1 ]: { kind: 'human' as const, name: 'Niels' },
	[ P2 ]: { kind: 'human' as const, name: 'Guest' },
};

/** Light opens with 6-1 and plays 13/7 8/7; Dark is then to roll. */
const setup = ( {
	matchTarget = 3,
	cube = true,
	dice = [ 6, 1, 5, 3, 4, 2 ],
	prior = [] as Array< [ Player, number ] >,
} = {} ) => {
	const store = makeStore( {
		middleware: [ createTurnDriver( { rng: scripted( dice ), delays: { roll: 0, aiStep: 0 } } ).middleware ],
	} );
	store.dispatch( configureSession( { players, matchTarget } ) );
	for ( const [ winner, points ] of prior ) store.dispatch( gameEnded( { winner, points } ) );
	render(
		<Provider store={ store }>
			<ActionBar />
			<CubeDialog />
			<GameOverDialog />
		</Provider>
	);
	act( () => {
		store.dispatch( newGame( { variant: 'backgammon', options: { cube } } ) );
	} );
	const play = ( from: number, die: number ) =>
		act( () => {
			const step = selectLegalSteps( store.getState() ).find( ( s ) => s.from === from && s.die === die )!;
			store.dispatch( playStep( { step } ) );
		} );
	play( 13, 6 );
	play( 8, 1 );
	return store;
};

const pause = () => act( () => new Promise( ( r ) => setTimeout( r, 20 ) ) );

describe( 'ActionBar and the doubling cube', () => {
	beforeEach( () => push.mockReset() );

	it( 'a human in a cube game gets a Roll button instead of an auto-roll', async () => {
		const store = setup();
		await pause();
		expect( store.getState().game.state.player ).toBe( P2 );
		expect( store.getState().game.state.dice ).toEqual( [] );
		await userEvent.click( screen.getByRole( 'button', { name: 'Roll' } ) );
		expect( store.getState().game.state.dice ).toEqual( [ 5, 3 ] );
		expect( screen.queryByRole( 'button', { name: 'Roll' } ) ).not.toBeInTheDocument();
	} );

	it( 'without the cube the dice are rolled automatically', async () => {
		const store = setup( { cube: false } );
		await waitFor( () => expect( store.getState().game.state.dice ).toEqual( [ 5, 3 ] ) );
		expect( screen.queryByRole( 'button', { name: /double/i } ) ).not.toBeInTheDocument();
	} );

	it( 'a double taken at 1 becomes 2, owned by the taker, and the doubler then rolls', async () => {
		const store = setup();
		await pause();
		await userEvent.click( screen.getByRole( 'button', { name: 'Double' } ) );
		const dialog = screen.getByRole( 'dialog', { name: /guest doubles to 2/i } );
		expect( dialog ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Take' } ) );
		expect( store.getState().game.state.cube ).toEqual( { value: 2, owner: P1, offered: false } );
		await waitFor( () => expect( store.getState().game.state.dice ).toEqual( [ 5, 3 ] ) );
	} );

	it( 'a dropped double can end the match', async () => {
		// Match to 5 at 1–4 after the Crawford game: doubling is allowed again.
		const store = setup( { matchTarget: 5, prior: [ [ P2, 4 ], [ P1, 1 ] ] } );
		await pause();
		await userEvent.click( screen.getByRole( 'button', { name: 'Double' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Drop' } ) );
		expect( store.getState().game.state.result ).toEqual( { winner: P2, points: 1, kind: 'drop' } );
		expect( store.getState().session.scores ).toEqual( { [ P1 ]: 1, [ P2 ]: 5 } );
		const over = screen.getByRole( 'dialog', { name: /guest wins the match/i } );
		expect( over ).toHaveTextContent( 'Niels declined the double' );
		expect( screen.queryByRole( 'button', { name: 'Next game' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'New match' } ) ).toBeInTheDocument();
	} );

	it( 'Next game keeps the score in a longer match', async () => {
		const store = setup( { matchTarget: 3 } );
		await pause();
		await userEvent.click( screen.getByRole( 'button', { name: 'Double' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Drop' } ) );
		expect( screen.getByRole( 'dialog', { name: /guest wins the game/i } ) ).toHaveTextContent( '0 – 1' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next game' } ) );
		expect( store.getState().session.gameNumber ).toBe( 2 );
		expect( store.getState().session.scores[ P2 ] ).toBe( 1 );
		expect( store.getState().game.state.phase ).toBe( 'moving' );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'hides Double in the Crawford game and ignores a direct offer', async () => {
		const store = makeStore( {
			middleware: [ createTurnDriver( { rng: scripted( [ 6, 1, 5, 3 ] ), delays: { roll: 0, aiStep: 0 } } ).middleware ],
		} );
		store.dispatch( configureSession( { players, matchTarget: 3 } ) );
		store.dispatch( gameEnded( { winner: P1, points: 2 } ) ); // 2–0: Crawford game next
		render(
			<Provider store={ store }>
				<ActionBar />
			</Provider>
		);
		act( () => {
			store.dispatch( newGame( { variant: 'backgammon' } ) );
		} );
		act( () => {
			for ( const [ from, die ] of [ [ 13, 6 ], [ 8, 1 ] ] ) {
				const step = selectLegalSteps( store.getState() ).find( ( s ) => s.from === from && s.die === die )!;
				store.dispatch( playStep( { step } ) );
			}
		} );
		// Without a legal double, the human's roll is automatic again.
		await waitFor( () => expect( store.getState().game.state.dice ).toEqual( [ 5, 3 ] ) );
		expect( screen.queryByRole( 'button', { name: 'Double' } ) ).not.toBeInTheDocument();
		act( () => {
			store.dispatch( offerDouble( { player: P2 } ) );
		} );
		expect( store.getState().game.state.cube.offered ).toBe( false );
	} );

	it( 'a 1-point match has no doubling, so the dice roll automatically', async () => {
		const store = setup( { matchTarget: 1 } );
		await waitFor( () => expect( store.getState().game.state.dice ).toEqual( [ 5, 3 ] ) );
		expect( screen.queryByRole( 'button', { name: 'Double' } ) ).not.toBeInTheDocument();
	} );

	it( 'Undo and Resign are available to the player to move', async () => {
		const store = setup();
		await pause();
		await userEvent.click( screen.getByRole( 'button', { name: 'Roll' } ) );
		const step = selectLegalSteps( store.getState() )[ 0 ];
		act( () => {
			store.dispatch( playStep( { step } ) );
		} );
		await userEvent.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		expect( store.getState().game.state.turnSteps ).toEqual( [] );
		await userEvent.click( screen.getByRole( 'button', { name: 'Resign' } ) );
		expect( store.getState().game.state.result ).toEqual( { winner: P1, points: 1, kind: 'resign' } );
	} );
} );
