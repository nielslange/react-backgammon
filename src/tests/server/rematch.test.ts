import { describe, expect, it } from 'vitest';
import { rematch } from '../../server/rooms';
import { submitMove } from '../../server/moves';
import { createRoom, joinRoom } from '../../server/rooms';
import { scripted } from '../../runtime/rng';
import { P1, P2 } from '../engine/fixtures';
import { memoryDb } from './memoryDb';

const finishedGame = async ( matchTarget: number ) => {
	const store = memoryDb();
	const { code } = await createRoom( store.db, 'host', { variant: 'backgammon', options: { cube: true }, matchTarget, name: 'H' } );
	const { gameId, roomId } = await joinRoom( store.db, 'guest', { code, name: 'G' }, scripted( [ 6, 1 ] ) );
	// The guest resigns: Light wins one point.
	await submitMove( store.db, 'guest', { gameId, kind: 'resign', payload: {}, version: 1 } );
	return { ...store, roomId, gameId };
};

describe( 'rematch', () => {
	it( 'starts the next game of the match with the scores carried and the opening rolled', async () => {
		const { db, roomId, games, moves } = await finishedGame( 3 );
		expect( games[ 0 ].scores ).toEqual( { [ P1 ]: 1, [ P2 ]: 0 } );
		const next = await rematch( db, 'guest', { roomId }, scripted( [ 2, 5 ] ) );
		expect( games ).toHaveLength( 2 );
		expect( games[ 1 ] ).toMatchObject( { id: next.gameId, number: 2, version: 1, scores: { [ P1 ]: 1, [ P2 ]: 0 } } );
		expect( games[ 1 ].snapshot ).toMatchObject( { phase: 'moving', player: P2, dice: [ 5, 2 ], cube: { value: 1 } } );
		expect( moves.at( -1 ) ).toMatchObject( { game_id: next.gameId, seq: 1, kind: 'opening' } );
	} );

	it( 'gives both players the same next game, however often they ask', async () => {
		const { db, roomId, games } = await finishedGame( 3 );
		const a = await rematch( db, 'host', { roomId, after: 1 } );
		const b = await rematch( db, 'guest', { roomId, after: 1 } );
		expect( b.gameId ).toBe( a.gameId );
		expect( games ).toHaveLength( 2 );
	} );

	it( 'carries the Crawford rule: no double in the game after reaching match point minus one', async () => {
		const { db, roomId, games } = await finishedGame( 2 );
		// Light leads 1-0 in a 2-point match: the next game is the Crawford game.
		const { gameId } = await rematch( db, 'host', { roomId }, scripted( [ 1, 6 ] ) );
		expect( games[ 1 ].crawford_played ).toBe( false );
		await expect( submitMove( db, 'guest', { gameId, kind: 'resign', payload: {}, version: 1 } ) ).resolves.toBeDefined();
		// Dark resigned the Crawford game: the match is over (2-0).
		expect( games[ 1 ].scores ).toEqual( { [ P1 ]: 2, [ P2 ]: 0 } );
	} );

	it( 'starts a new match once the match is over', async () => {
		const { db, roomId, games, rooms } = await finishedGame( 1 );
		expect( rooms[ 0 ].status ).toBe( 'finished' );
		await rematch( db, 'host', { roomId } );
		expect( games[ 1 ] ).toMatchObject( { number: 2, scores: { [ P1 ]: 0, [ P2 ]: 0 }, crawford_played: false } );
		expect( rooms[ 0 ].status ).toBe( 'playing' );
	} );

	it( 'refuses while the game is still being played, and for strangers', async () => {
		const store = memoryDb();
		const { code } = await createRoom( store.db, 'host', { variant: 'backgammon', options: {}, matchTarget: 3, name: 'H' } );
		const { roomId } = await joinRoom( store.db, 'guest', { code, name: 'G' } );
		await expect( rematch( store.db, 'host', { roomId } ) ).rejects.toMatchObject( { code: 'GAME_NOT_OVER' } );
		await expect( rematch( store.db, 'stranger', { roomId } ) ).rejects.toMatchObject( { code: 'NOT_A_PLAYER' } );
	} );
} );
