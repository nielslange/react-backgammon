import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { StartScreen } from '../../components/StartScreen';
import { makeStore } from '../../data/createStore';
import { P1, P2 } from '../engine/fixtures';

const push = vi.fn();
vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push } ) } ) );

const renderStart = () => {
	const store = makeStore();
	render(
		<Provider store={ store }>
			<StartScreen />
		</Provider>
	);
	return store;
};

describe( 'StartScreen', () => {
	beforeEach( () => push.mockReset() );

	it( 'starts a local backgammon match with the chosen names and length', async () => {
		const store = renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: /backgammon/i } ) );
		await userEvent.click( screen.getByRole( 'radio', { name: 'Local' } ) );
		const blue = screen.getByLabelText( 'Light player' );
		await userEvent.clear( blue );
		await userEvent.type( blue, 'Niels' );
		const red = screen.getByLabelText( 'Dark player' );
		await userEvent.clear( red );
		await userEvent.type( red, 'Guest' );
		await userEvent.click( screen.getByRole( 'radio', { name: '5 points' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Start game' } ) );

		const { session, game } = store.getState();
		expect( session.players[ P1 ] ).toEqual( { kind: 'human', name: 'Niels' } );
		expect( session.players[ P2 ] ).toEqual( { kind: 'human', name: 'Guest' } );
		expect( session.matchTarget ).toBe( 5 );
		expect( game.state.variant ).toBe( 'backgammon' );
		expect( game.state.phase ).toBe( 'opening' );
		expect( game.state.options.cube ).toBe( true );
		expect( push ).toHaveBeenCalledWith( '/game' );
	} );

	it( 'disables the doubling cube for a 1-point match, where it changes nothing', async () => {
		renderStart();
		expect( screen.getByRole( 'switch', { name: /doubling cube/i } ) ).toBeDisabled();
		await userEvent.click( screen.getByRole( 'radio', { name: '3 points' } ) );
		expect( screen.getByRole( 'switch', { name: /doubling cube/i } ) ).toBeEnabled();
	} );

	it( 'can switch the doubling cube off', async () => {
		const store = renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: '3 points' } ) );
		await userEvent.click( screen.getByRole( 'switch', { name: /doubling cube/i } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Start game' } ) );
		expect( store.getState().game.state.options.cube ).toBe( false );
	} );

	it( 'falls back to default names when a field is left empty', async () => {
		const store = renderStart();
		await userEvent.clear( screen.getByLabelText( 'Light player' ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Start game' } ) );
		expect( store.getState().session.players[ P1 ].name ).toBe( 'Light' );
	} );

	it( 'starts a Triktrak game with its own options and no cube', async () => {
		const store = renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: /triktrak/i } ) );
		expect( screen.queryByRole( 'switch', { name: /doubling cube/i } ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'switch', { name: /enter only on doubles/i } ) );
		await userEvent.click( screen.getByRole( 'radio', { name: 'Once' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Start game' } ) );
		const { options, variant } = store.getState().game.state;
		expect( variant ).toBe( 'triktrak' );
		expect( options ).toMatchObject( {
			cube: false,
			enterOnlyOnDoubles: true,
			rerollLimit: 1,
			rerollOnlyIfCompleted: true,
			finalTurnForSecondPlayer: true,
			maxCheckersPerPoint: null,
		} );
	} );

	it( 'starts a game against the computer at the chosen level', async () => {
		const store = renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: /computer/i } ) );
		expect( screen.queryByLabelText( 'Dark player' ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'radio', { name: 'Hard' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Start game' } ) );
		expect( store.getState().session.players[ P2 ] ).toEqual( { kind: 'ai', name: 'Computer (hard)', level: 'hard' } );
		expect( store.getState().session.players[ P1 ].kind ).toBe( 'human' );
	} );

	it( 'shows online play as not yet available', () => {
		renderStart();
		expect( screen.getByRole( 'radio', { name: /online/i } ) ).toBeDisabled();
	} );
} );
