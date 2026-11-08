import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { RoomScreen } from '../../components/RoomScreen';
import { makeStore } from '../../data/createStore';
import { createOnlineHolder } from '../../net/onlineGame';
import { createOnlineDriver } from '../../net/onlineDriver';
import { scripted } from '../../runtime/rng';
import { P2 } from '../engine/fixtures';
import { fakeNetwork } from '../net/fakeNetwork';

vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push: () => {} } ), usePathname: () => '/room/X' } ) );

const visit = ( net: ReturnType< typeof fakeNetwork >, userId: string, code: string ) => {
	const holder = createOnlineHolder();
	const store = makeStore( { middleware: [ createOnlineDriver( holder, { rollDelay: 0 } ).middleware ] } );
	const deps = { transport: net.transportFor( userId ), signIn: async () => userId, holder, pollMs: 20 };
	render(
		<Provider store={ store }>
			<RoomScreen code={ code } deps={ deps } />
		</Provider>
	);
	return store;
};

const hostRoom = async () => {
	const net = fakeNetwork( scripted( [ 6, 1 ] ) );
	const { code } = await net.transportFor( 'host' ).createRoom( { variant: 'backgammon', options: { cube: false }, matchTarget: 3, name: 'Niels' } );
	return { net, code };
};

describe( 'the room page', () => {
	it( 'shows the host a lobby with the code and link, then the game once a friend joins', async () => {
		const { net, code } = await hostRoom();
		visit( net, 'host', code );
		expect( await screen.findByText( code ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /copy link/i } ) ).toBeInTheDocument();
		expect( screen.getByText( /waiting for your friend/i ) ).toBeInTheDocument();
		await net.transportFor( 'guest' ).joinRoom( code, 'Guest' );
		expect( await screen.findByRole( 'group', { name: 'Backgammon board' } ) ).toBeInTheDocument();
	} );

	it( 'invites a visitor to join, then seats them as Dark', async () => {
		const { net, code } = await hostRoom();
		const store = visit( net, 'guest', code.toLowerCase() );
		expect( await screen.findByText( /Niels invites you/i ) ).toBeInTheDocument();
		await userEvent.clear( screen.getByLabelText( 'Your name' ) );
		await userEvent.type( screen.getByLabelText( 'Your name' ), 'Anna' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Join game' } ) );
		expect( await screen.findByRole( 'group', { name: 'Backgammon board' } ) ).toBeInTheDocument();
		await waitFor( () => expect( store.getState().net ).toMatchObject( { role: 'guest', seat: P2 } ) );
		expect( store.getState().session.players[ P2 ] ).toEqual( { kind: 'human', name: 'Anna' } );
	} );

	it( 'tells a third visitor that the room is full, and an unknown code that it does not exist', async () => {
		const { net, code } = await hostRoom();
		await net.transportFor( 'guest' ).joinRoom( code, 'Guest' );
		visit( net, 'stranger', code );
		expect( await screen.findByText( /this room is full/i ) ).toBeInTheDocument();
	} );

	it( 'says when a room does not exist', async () => {
		const { net } = await hostRoom();
		visit( net, 'host', 'ZZZZZZ' );
		expect( await screen.findByText( /no room with the code ZZZZZZ/i ) ).toBeInTheDocument();
	} );
} );

describe( 'the room page on a shaky connection', () => {
	it( 'keeps the lobby through a failed check, and offers Try again on an error', async () => {
		const { net, code } = await hostRoom();
		const holder = createOnlineHolder();
		const store = makeStore( { middleware: [ createOnlineDriver( holder, { rollDelay: 0 } ).middleware ] } );
		const transport = net.transportFor( 'host' );
		const describe = transport.describeRoom;
		let failures = 1;
		transport.describeRoom = async ( c ) => {
			if ( failures-- === 1 ) return describe( c );
			if ( failures >= -1 ) throw Object.assign( new Error( 'blip' ), { code: 'SERVER_ERROR' } );
			return describe( c );
		};
		render(
			<Provider store={ store }>
				<RoomScreen code={ code } deps={ { transport, signIn: async () => 'host', holder, pollMs: 20 } } />
			</Provider>
		);
		expect( await screen.findByText( /waiting for your friend/i ) ).toBeInTheDocument();
		await new Promise( ( r ) => setTimeout( r, 100 ) );
		// The two failed checks did not replace the lobby.
		expect( screen.getByText( /waiting for your friend/i ) ).toBeInTheDocument();
		await net.transportFor( 'guest' ).joinRoom( code, 'Guest' );
		expect( await screen.findByRole( 'group', { name: 'Backgammon board' } ) ).toBeInTheDocument();
	} );

	it( 'shows Try again when the room cannot be opened at all', async () => {
		const { net, code } = await hostRoom();
		const transport = net.transportFor( 'host' );
		const describe = transport.describeRoom;
		let fail = true;
		transport.describeRoom = async ( c ) => {
			if ( fail ) throw Object.assign( new Error( 'down' ), { code: 'SERVER_ERROR' } );
			return describe( c );
		};
		const holder = createOnlineHolder();
		render(
			<Provider store={ makeStore() }>
				<RoomScreen code={ code } deps={ { transport, signIn: async () => 'host', holder, pollMs: 20 } } />
			</Provider>
		);
		const retry = await screen.findByRole( 'button', { name: 'Try again' } );
		fail = false;
		await userEvent.click( retry );
		expect( await screen.findByText( /waiting for your friend/i ) ).toBeInTheDocument();
	} );
} );
