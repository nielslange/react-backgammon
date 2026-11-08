import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { makeStore } from '../../data/createStore';
import { playStep, undoStep } from '../../data/gameSlice';
import { requestRoll } from '../../data/intents';
import { selectLegalSteps } from '../../data/selectors';
import { connectGame, createOnlineHolder } from '../../net/onlineGame';
import { createOnlineDriver } from '../../net/onlineDriver';
import { createTurnDriver } from '../../runtime/turnDriver';
import { scripted } from '../../runtime/rng';
import { optionsForChecker } from '../../ui/moveInput';
import { P1, P2 } from '../engine/fixtures';
import { fakeNetwork } from './fakeNetwork';

/** Two tabs, host (Light) and guest (Dark), connected to one fake backend. */
const twoPlayers = async ( dice: number[], options: Record< string, unknown > = { cube: false } ) => {
	const net = fakeNetwork( scripted( dice ) );
	const localDice = { calls: 0 };
	const tab = ( userId: string ) => {
		const holder = createOnlineHolder();
		const store = makeStore( {
			middleware: [
				createTurnDriver( {
					rng: () => {
						localDice.calls++;
						return 0.5;
					},
					delays: { roll: 0, aiStep: 0 },
				} ).middleware,
				createOnlineDriver( holder, { rollDelay: 0 } ).middleware,
			],
		} );
		return { store, holder, transport: net.transportFor( userId ) };
	};
	const host = tab( 'host' );
	const guest = tab( 'guest' );
	const { code } = await host.transport.createRoom( { variant: 'backgammon', options, matchTarget: 3, name: 'Niels' } );
	const joined = await guest.transport.joinRoom( code, 'Guest' );
	const room = net.rooms[ 0 ];
	const base = { gameId: joined.gameId, roomId: room.id, roomCode: code, hostName: 'Niels', guestName: 'Guest', matchTarget: 3 };
	await connectGame( host.store, host.holder, host.transport, { ...base, role: 'host' } );
	await connectGame( guest.store, guest.holder, guest.transport, { ...base, role: 'guest' } );
	return { net, host, guest, localDice };
};

type Tab = Awaited< ReturnType< typeof twoPlayers > >[ 'host' ];
const play = ( tab: Tab, index = 0 ) => tab.store.dispatch( playStep( { step: selectLegalSteps( tab.store.getState() )[ index ] } ) );
const same = ( a: Tab, b: Tab ) => expect( a.store.getState().game.state ).toEqual( b.store.getState().game.state );

describe( 'an online game between two tabs', () => {
	it( 'starts both tabs on the server’s opening roll with the right seats', async () => {
		const { host, guest } = await twoPlayers( [ 6, 1 ] );
		same( host, guest );
		expect( host.store.getState().game.state ).toMatchObject( { phase: 'moving', player: P1, dice: [ 6, 1 ] } );
		expect( host.store.getState().session.players ).toEqual( {
			[ P1 ]: { kind: 'human', name: 'Niels' },
			[ P2 ]: { kind: 'remote', name: 'Guest' },
		} );
		expect( guest.store.getState().session.players[ P1 ] ).toEqual( { kind: 'remote', name: 'Niels' } );
		expect( guest.store.getState().net ).toMatchObject( { role: 'guest', seat: P2, status: 'playing', version: 1 } );
	} );

	it( 'shows a move at once, sends it, and the opponent sees it; dice come from the server', async () => {
		// Opening 6-1 for Light, then Dark rolls 5-2.
		const { host, guest, localDice } = await twoPlayers( [ 6, 1, 5, 2 ] );
		play( host );
		expect( host.store.getState().game.state.turnSteps ).toHaveLength( 1 );
		play( host );
		await waitFor( () => expect( guest.store.getState().game.state.player ).toBe( P2 ) );
		// Dark's tab asks the server to roll (no cube: automatically).
		await waitFor( () => expect( guest.store.getState().game.state.dice ).toEqual( [ 5, 2 ] ) );
		await waitFor( () => same( host, guest ) );
		expect( host.store.getState().net?.version ).toBe( 4 );
		expect( localDice.calls ).toBe( 0 );
	} );

	it( 'rolls by hand when the player could double first', async () => {
		const { host, guest } = await twoPlayers( [ 6, 1, 4, 3 ], { cube: true } );
		play( host );
		play( host );
		await waitFor( () => expect( guest.store.getState().game.state ).toMatchObject( { phase: 'awaiting-roll', player: P2 } ) );
		await new Promise( ( r ) => setTimeout( r, 20 ) );
		expect( guest.store.getState().game.state.phase ).toBe( 'awaiting-roll' );
		guest.store.dispatch( requestRoll() );
		await waitFor( () => expect( host.store.getState().game.state.dice ).toEqual( [ 4, 3 ] ) );
	} );

	it( 'sends an undo, and replaces a refused move with the server’s state', async () => {
		const { host, guest } = await twoPlayers( [ 6, 1 ] );
		play( host );
		host.store.dispatch( undoStep() );
		await waitFor( () => expect( host.holder.current?.pending ).toBe( 0 ) );
		await waitFor( () => same( host, guest ) );
		expect( guest.store.getState().game.state.turnSteps ).toHaveLength( 0 );

		host.transport.failNextSubmit();
		play( host );
		expect( host.store.getState().game.state.turnSteps ).toHaveLength( 1 );
		await waitFor( () => expect( host.store.getState().game.state.turnSteps ).toHaveLength( 0 ) );
		same( host, guest );
	} );

	it( 'ignores moves for the other seat and plays nothing for the remote player', async () => {
		const { host, guest } = await twoPlayers( [ 6, 1 ] );
		// Dark's tab cannot move Light's checkers: the board refuses before anything is sent.
		const light = guest.store.getState().game.state.checkers.find( ( c ) => c.player === P1 && c.lane === 13 )!;
		expect( optionsForChecker( guest.store.getState(), light.id ) ).toEqual( [] );
		expect( guest.holder.current?.pending ).toBe( 0 );
		expect( host.holder.current?.pending ).toBe( 0 );
	} );
} );
