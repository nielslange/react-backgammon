import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { StartScreen } from '../../components/StartScreen';
import { makeStore } from '../../data/createStore';
import { P1, P2 } from '../engine/fixtures';

const push = vi.fn();
vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push } ) } ) );

const createRoom = vi.fn();
vi.mock( '../../net/appRoom', () => ( {
	appTransport: () => ( { createRoom } ),
	signIn: async () => 'user-1',
} ) );

// Online play needs the backend's keys; tests run as a configured build.
vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321' );
vi.stubEnv( 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon' );

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

	it( 'defaults to an easy Triktrak game for Niels against the computer', async () => {
		const store = renderStart();
		expect( screen.getByLabelText( 'Light player' ) ).toHaveValue( 'Niels' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Start game' } ) );
		const { session, game } = store.getState();
		expect( session.players[ P1 ] ).toEqual( { kind: 'human', name: 'Niels' } );
		expect( session.players[ P2 ] ).toEqual( { kind: 'ai', name: 'Computer (Easy)', level: 'easy' } );
		expect( game.state.variant ).toBe( 'triktrak' );
		expect( game.state.options ).toMatchObject( { rerollLimit: null, maxCheckersPerPoint: 5 } );
	} );

	it( 'disables the doubling cube for a 1-point match, where it changes nothing', async () => {
		renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: /backgammon/i } ) );
		expect( screen.getByRole( 'switch', { name: /doubling cube/i } ) ).toBeDisabled();
		await userEvent.click( screen.getByRole( 'radio', { name: '3 points' } ) );
		expect( screen.getByRole( 'switch', { name: /doubling cube/i } ) ).toBeEnabled();
	} );

	it( 'can switch the doubling cube off', async () => {
		const store = renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: /backgammon/i } ) );
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
			maxCheckersPerPoint: 5,
		} );
	} );

	it( 'starts a game against the computer at the chosen level', async () => {
		const store = renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: /computer/i } ) );
		expect( screen.queryByLabelText( 'Dark player' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'You play Light; the computer plays Dark.' ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'radio', { name: 'Hard' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Start game' } ) );
		expect( store.getState().session.players[ P2 ] ).toEqual( { kind: 'ai', name: 'Computer (Hard)', level: 'hard' } );
		expect( store.getState().session.players[ P1 ].kind ).toBe( 'human' );
	} );

	it( 'creates an online room with the chosen game and opens it', async () => {
		createRoom.mockResolvedValueOnce( { code: 'K7QM2X' } );
		renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: /^backgammon/i } ) );
		await userEvent.click( screen.getByRole( 'radio', { name: 'Online' } ) );
		expect( screen.queryByLabelText( 'Dark player' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'radio', { name: 'Hard' } ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'radio', { name: '3 points' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Create room' } ) );
		expect( createRoom ).toHaveBeenCalledWith( {
			variant: 'backgammon',
			options: { cube: true },
			matchTarget: 3,
			name: 'Niels',
		} );
		expect( push ).toHaveBeenCalledWith( '/room/K7QM2X' );
	} );

	it( 'says so when a room cannot be created', async () => {
		createRoom.mockRejectedValueOnce( Object.assign( new Error( 'x' ), { code: 'SERVER_ERROR' } ) );
		renderStart();
		await userEvent.click( screen.getByRole( 'radio', { name: 'Online' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Create room' } ) );
		expect( await screen.findByRole( 'alert' ) ).toHaveTextContent( /could not create the room/i );
	} );

	it( 'joins a friend’s room by its code', async () => {
		push.mockClear();
		renderStart();
		await userEvent.type( screen.getByLabelText( 'Room code' ), ' k7qm2x ' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Join' } ) );
		expect( push ).toHaveBeenCalledWith( '/room/K7QM2X' );
	} );
} );
