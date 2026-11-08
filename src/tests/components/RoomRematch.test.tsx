import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { RoomScreen } from '../../components/RoomScreen';
import { makeStore } from '../../data/createStore';
import { registerOnlineHolder } from '../../data/store';
import { createOnlineHolder } from '../../net/onlineGame';
import { createOnlineDriver } from '../../net/onlineDriver';
import { scripted } from '../../runtime/rng';
import { P1, P2 } from '../engine/fixtures';
import { fakeNetwork } from '../net/fakeNetwork';

vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push: () => {} } ), usePathname: () => '/room/X' } ) );

const tab = ( net: ReturnType< typeof fakeNetwork >, userId: string, code: string ) => {
	const holder = createOnlineHolder();
	const store = makeStore( { middleware: [ createOnlineDriver( holder, { rollDelay: 0 } ).middleware ] } );
	registerOnlineHolder( store, holder );
	const deps = { transport: net.transportFor( userId ), signIn: async () => userId, holder, pollMs: 20 };
	const view = render(
		<Provider store={ store }>
			<RoomScreen code={ code } deps={ deps } />
		</Provider>
	);
	return { store, view, transport: deps.transport };
};

const startedRoom = async ( matchTarget = 3 ) => {
	const net = fakeNetwork( scripted( [ 6, 1, 2, 5 ] ) );
	const { code } = await net.transportFor( 'host' ).createRoom( { variant: 'backgammon', options: { cube: false }, matchTarget, name: 'Niels' } );
	await net.transportFor( 'guest' ).joinRoom( code, 'Anna' );
	return { net, code };
};

describe( 'rematch and reconnect', () => {
	it( 'starts the next game for both players from the game-over dialog', async () => {
		const { net, code } = await startedRoom();
		const host = tab( net, 'host', code );
		const guest = tab( net, 'guest', code );
		await waitFor( () => expect( guest.store.getState().net?.gameId ).toBeTruthy() );
		// Anna resigns: Niels wins 1 point.
		await guest.transport.submit( guest.store.getState().net!.gameId!, { kind: 'resign', payload: {}, version: 1 } );
		const dialog = await within( host.view.container ).findByRole( 'dialog' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Next game' } ) );
		await waitFor( () => expect( host.store.getState().session.gameNumber ).toBe( 2 ) );
		await waitFor( () => expect( guest.store.getState().session.gameNumber ).toBe( 2 ) );
		for ( const t of [ host, guest ] ) {
			expect( t.store.getState().session.scores ).toEqual( { [ P1 ]: 1, [ P2 ]: 0 } );
			expect( t.store.getState().game.state ).toMatchObject( { phase: 'moving', player: P2, dice: [ 5, 2 ] } );
		}
		expect( screen.queryAllByRole( 'dialog' ) ).toHaveLength( 0 );
	} );

	it( 'resumes the same game after a reload', async () => {
		const { net, code } = await startedRoom();
		const first = tab( net, 'host', code );
		await waitFor( () => expect( first.store.getState().net?.version ).toBe( 1 ) );
		const gameId = first.store.getState().net!.gameId!;
		const [ step ] = ( await import( '../../engine' ) ).getEngine( 'backgammon' ).legalSteps( first.store.getState().game.state );
		await first.transport.submit( gameId, { kind: 'step', payload: { step }, version: 1 } );
		await waitFor( () => expect( first.store.getState().net?.version ).toBe( 2 ) );
		first.view.unmount();
		// A new tab for the same visitor (a reload): same game, same position.
		const again = tab( net, 'host', code );
		await waitFor( () => expect( again.store.getState().net?.version ).toBe( 2 ) );
		expect( again.store.getState().game.state ).toEqual( first.store.getState().game.state );
		expect( again.store.getState().session.players[ P1 ] ).toEqual( { kind: 'human', name: 'Niels' } );
	} );
} );
