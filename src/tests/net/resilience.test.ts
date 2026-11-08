import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { makeStore } from '../../data/createStore';
import { playStep } from '../../data/gameSlice';
import { selectLegalSteps } from '../../data/selectors';
import { connectGame, createOnlineHolder } from '../../net/onlineGame';
import { createOnlineDriver } from '../../net/onlineDriver';
import { createTurnDriver } from '../../runtime/turnDriver';
import { scripted } from '../../runtime/rng';
import { MessageType } from '../../types';
import { P1, P2 } from '../engine/fixtures';
import { fakeNetwork } from './fakeNetwork';

type Net = ReturnType< typeof fakeNetwork >;

const tab = ( net: Net, userId: string ) => {
	const holder = createOnlineHolder();
	const store = makeStore( {
		middleware: [
			createTurnDriver( { rng: () => 0.5, delays: { roll: 0, aiStep: 0 } } ).middleware,
			createOnlineDriver( holder, { rollDelay: 0, rollRetryMs: 20 } ).middleware,
		],
	} );
	const hints: string[] = [];
	store.subscribe( () => {
		const hint = store.getState().ui.hint?.message;
		if ( hint && hints.at( -1 ) !== hint ) hints.push( hint );
	} );
	return { store, holder, hints, transport: net.transportFor( userId ) };
};
type Tab = ReturnType< typeof tab >;

const room = async ( dice: number[], matchTarget = 3 ) => {
	const net = fakeNetwork( scripted( dice ) );
	const host = tab( net, 'host' );
	const guest = tab( net, 'guest' );
	const { code } = await host.transport.createRoom( { variant: 'backgammon', options: { cube: false }, matchTarget, name: 'Niels' } );
	const joined = await guest.transport.joinRoom( code, 'Anna' );
	const base = { gameId: joined.gameId, roomId: net.rooms[ 0 ].id, roomCode: code, hostName: 'Niels', guestName: 'Anna', matchTarget };
	const connect = ( t: Tab, role: 'host' | 'guest' ) => connectGame( t.store, t.holder, t.transport, { ...base, role }, { pollMs: 25 } );
	await connect( host, 'host' );
	await connect( guest, 'guest' );
	return { net, host, guest, base, connect };
};

const play = ( t: Tab ) => t.store.dispatch( playStep( { step: selectLegalSteps( t.store.getState() )[ 0 ] } ) );

describe( 'staying in step when the connection is unreliable', () => {
	it( 'catches up after live delivery broke, through the backstop poll', async () => {
		const { net, host, guest } = await room( [ 6, 1, 3, 2 ] );
		net.live.drop = true;
		play( host );
		play( host );
		await waitFor( () => expect( host.holder.current?.pending ).toBe( 0 ) );
		// Nothing arrived live, yet the guest learns it is to move and gets its dice.
		await waitFor( () => expect( guest.store.getState().game.state ).toMatchObject( { player: P2, dice: [ 3, 2 ] } ) );
	} );

	it( 'fetches what it missed as soon as live delivery resumes', async () => {
		const { net, host, guest, base } = await room( [ 6, 1 ] );
		// Without the poll (long interval) only the reconnect can help.
		guest.holder.current?.stop();
		await connectGame( guest.store, guest.holder, guest.transport, { ...base, role: 'guest' }, { pollMs: 60000 } );
		net.live.drop = true;
		play( host );
		await waitFor( () => expect( host.holder.current?.pending ).toBe( 0 ) );
		expect( guest.store.getState().net?.version ).toBe( 1 );
		net.reconnect();
		await waitFor( () => expect( guest.store.getState().net?.version ).toBe( 2 ) );
	} );

	it( 'counts a finished game once when a player reloads on the game-over screen', async () => {
		const { host, guest, base } = await room( [ 6, 1 ], 5 );
		await guest.transport.submit( base.gameId, { kind: 'resign', payload: {}, version: 1 } );
		await waitFor( () => expect( host.store.getState().game.state.phase ).toBe( 'over' ) );
		const reloaded = tab( { transportFor: () => host.transport } as unknown as Net, 'host' );
		await connectGame( reloaded.store, reloaded.holder, host.transport, { ...base, role: 'host' }, { pollMs: 60000 } );
		expect( reloaded.store.getState().session.scores ).toEqual( { [ P1 ]: 1, [ P2 ]: 0 } );
		expect( host.store.getState().session.scores ).toEqual( { [ P1 ]: 1, [ P2 ]: 0 } );
	} );

	it( 'drops the rest of the queue after a refusal and reports it once', async () => {
		const { net, host, guest } = await room( [ 6, 1 ] );
		host.transport.failNextSubmit();
		play( host );
		play( host );
		await waitFor( () => expect( host.hints ).toContain( MessageType.ONLINE_REFUSED ) );
		await waitFor( () => expect( host.holder.current?.pending ).toBe( 0 ) );
		await new Promise( ( r ) => setTimeout( r, 50 ) );
		// Only the refused move was sent: the second was meant for a position that never existed.
		expect( host.transport.submits ).toBe( 1 );
		expect( net.games[ 0 ].version ).toBe( 1 );
		expect( host.hints.filter( ( h ) => h === MessageType.ONLINE_REFUSED ) ).toHaveLength( 1 );
		expect( host.store.getState().game.state ).toEqual( guest.store.getState().game.state );
	} );

	it( 'shows what happened while its own move was being confirmed', async () => {
		const { host, guest, base } = await room( [ 6, 1 ] );
		const release = host.transport.holdAcks();
		play( host );
		// The step is stored (version 2); Anna resigns before Niels's tab hears back.
		await waitFor( () => expect( guest.store.getState().net?.version ).toBe( 2 ) );
		await guest.transport.submit( base.gameId, { kind: 'resign', payload: {}, version: 2 } );
		await waitFor( () => expect( host.holder.current?.sync.current().version ).toBe( 3 ) );
		release();
		await waitFor( () => expect( host.store.getState().game.state.phase ).toBe( 'over' ) );
	} );

	it( 'asks for the dice again when the request failed', async () => {
		const { host, guest } = await room( [ 6, 1, 4, 2 ] );
		guest.transport.failNextSubmit();
		play( host );
		play( host );
		await waitFor( () => expect( guest.store.getState().game.state ).toMatchObject( { player: P2, dice: [ 4, 2 ] } ) );
		// A failed automatic roll is not a refused move.
		expect( guest.hints ).not.toContain( MessageType.ONLINE_REFUSED );
	} );
} );
