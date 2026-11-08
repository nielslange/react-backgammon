import { describe, expect, it } from 'vitest';
import { getEngine } from '../../engine';
import type { GameState, Player } from '../../engine/types';
import { replay } from '../../net/protocol';
import { submitMove } from '../../server/moves';
import { createRoom, joinRoom } from '../../server/rooms';
import { scripted, seeded, type Rng } from '../../runtime/rng';
import { P1, P2 } from '../engine/fixtures';
import { memoryDb } from './memoryDb';

const HOST = 'host';
const GUEST = 'guest';
const userOf = ( p: Player ) => ( p === P1 ? HOST : GUEST );

/** A room where the opening roll was `opening` (Light 6, Dark 1 by default). */
const started = async ( {
	variant = 'backgammon' as 'backgammon' | 'triktrak',
	opening = [ 6, 1 ],
	matchTarget = 1,
	options = { cube: false } as Record< string, unknown >,
} = {} ) => {
	const store = memoryDb();
	const { code } = await createRoom( store.db, HOST, {
		variant,
		options,
		matchTarget,
		name: 'Host',
	} );
	const { gameId } = await joinRoom(
		store.db,
		GUEST,
		{ code, name: 'Guest' },
		scripted( opening )
	);
	const state = async () => ( await store.db.gameById( gameId ) )!;
	return { ...store, gameId, state };
};

describe( 'submitMove', () => {
	it( 'plays a legal step for the player to move and logs the engine’s own step', async () => {
		const { db, gameId, state, moves } = await started();
		const before = await state();
		const step = getEngine( 'backgammon' ).legalSteps(
			before.snapshot
		)[ 0 ];
		const { version } = await submitMove( db, HOST, {
			gameId,
			kind: 'step',
			payload: { step: { ...step, checkerId: 999 } },
			version: before.version,
		} );
		expect( version ).toBe( 2 );
		const logged = moves.at( -1 )!;
		expect( logged ).toMatchObject( { seq: 2, actor: HOST, kind: 'step' } );
		// The checker id comes from the engine, never from the client.
		expect(
			( logged.payload as { step: { checkerId: number } } ).step.checkerId
		).toBe( step.checkerId );
	} );

	it( 'refuses an illegal step, a move out of turn, a stale version and a stranger', async () => {
		const { db, gameId, state } = await started();
		const { version, snapshot } = await state();
		await expect(
			submitMove( db, HOST, {
				gameId,
				kind: 'step',
				payload: { step: { checkerId: 1, from: 24, to: 3, die: 21 } },
				version,
			} )
		).rejects.toMatchObject( { code: 'ILLEGAL_STEP' } );
		await expect(
			submitMove( db, GUEST, {
				gameId,
				kind: 'roll',
				payload: {},
				version,
			} )
		).rejects.toMatchObject( {
			code: 'NOT_YOUR_TURN',
		} );
		const step = getEngine( 'backgammon' ).legalSteps( snapshot )[ 0 ];
		await expect(
			submitMove( db, GUEST, {
				gameId,
				kind: 'step',
				payload: { step },
				version,
			} )
		).rejects.toMatchObject( {
			code: 'NOT_YOUR_TURN',
		} );
		await expect(
			submitMove( db, HOST, {
				gameId,
				kind: 'step',
				payload: { step },
				version: version - 1,
			} )
		).rejects.toMatchObject( {
			code: 'STALE_VERSION',
		} );
		await expect(
			submitMove( db, 'stranger', {
				gameId,
				kind: 'resign',
				payload: {},
				version,
			} )
		).rejects.toMatchObject( {
			code: 'NOT_A_PLAYER',
		} );
		await expect(
			submitMove( db, null, {
				gameId,
				kind: 'resign',
				payload: {},
				version,
			} )
		).rejects.toMatchObject( {
			code: 'NOT_SIGNED_IN',
		} );
		expect( ( await state() ).version ).toBe( version );
	} );

	it( 'rolls on the server and ignores dice sent by the client', async () => {
		const { db, gameId, state } = await started();
		// Light plays the opening 6-1 (13/7 8/7), then Dark rolls.
		for ( let i = 0; i < 2; i++ ) {
			const g = await state();
			const step = getEngine( 'backgammon' ).legalSteps(
				g.snapshot
			)[ 0 ];
			await submitMove( db, HOST, {
				gameId,
				kind: 'step',
				payload: { step },
				version: g.version,
			} );
		}
		const g = await state();
		expect( g.snapshot ).toMatchObject( {
			phase: 'awaiting-roll',
			player: P2,
		} );
		await submitMove(
			db,
			GUEST,
			{
				gameId,
				kind: 'roll',
				payload: { roll: [ 6, 6 ] },
				version: g.version,
			},
			scripted( [ 3, 2 ] )
		);
		expect( ( await state() ).snapshot.roll ).toEqual( [ 3, 2 ] );
	} );

	it( 'replaying the move log gives the stored snapshot', async () => {
		const { db, gameId, state, moves, games } = await started();
		await playOut( db, gameId, state, seeded( 7 ), 6 );
		const room = games[ 0 ];
		const initial =
			getEngine( 'backgammon' ) &&
			( await import( '../../engine/game' ) ).createGame( 'backgammon', {
				cube: false,
			} );
		expect(
			replay(
				initial,
				moves.filter( ( m ) => m.game_id === room.id )
			)
		).toEqual( ( await state() ).snapshot );
	} );

	it( 'plays a whole game to the end and scores the match', async () => {
		const { db, gameId, state, rooms } = await started();
		await playOut( db, gameId, state, seeded( 3 ), 1000 );
		const g = await state();
		expect( g.snapshot.phase ).toBe( 'over' );
		const winner = g.snapshot.result!.winner!;
		expect( g.scores[ winner ] ).toBeGreaterThanOrEqual( 1 );
		expect( rooms[ 0 ].status ).toBe( 'finished' );
	} );

	it( 'gives a Triktrak player the bonus roll after a completed double, on the server', async () => {
		// Opening 4-1 for Light (2-1 would be a tric trac with its own bonus roll); Light
		// finishes, Dark rolls 3-3 (a double), plays it and, if completed, rolls again.
		const { db, gameId, state } = await started( {
			variant: 'triktrak',
			opening: [ 4, 1 ],
			options: {},
		} );
		await finishTurn( db, gameId, state );
		let g = await state();
		expect( g.snapshot ).toMatchObject( {
			phase: 'awaiting-roll',
			player: P2,
		} );
		await submitMove(
			db,
			GUEST,
			{ gameId, kind: 'roll', payload: {}, version: g.version },
			scripted( [ 3, 3 ] )
		);
		g = await state();
		if ( g.snapshot.phase === 'moving' )
			await finishTurn( db, gameId, state );
		g = await state();
		// Dark entered with 3, 3, 4, 4: the double was completed, so Dark rolls again.
		expect( g.snapshot ).toMatchObject( {
			phase: 'awaiting-roll',
			player: P2,
			lastEvent: 'reroll',
		} );
		await submitMove(
			db,
			GUEST,
			{ gameId, kind: 'roll', payload: {}, version: g.version },
			scripted( [ 1, 2 ] )
		);
		expect( ( await state() ).snapshot ).toMatchObject( {
			player: P2,
			roll: [ 1, 2 ],
		} );
	} );

	it( 'handles the cube: double, take, and no double in the Crawford game', async () => {
		const { db, gameId, state } = await started( {
			matchTarget: 3,
			options: { cube: true },
		} );
		await finishTurn( db, gameId, state );
		let g = await state();
		await submitMove( db, GUEST, {
			gameId,
			kind: 'double',
			payload: {},
			version: g.version,
		} );
		g = await state();
		expect( g.snapshot.cube.offered ).toBe( true );
		await expect(
			submitMove( db, GUEST, {
				gameId,
				kind: 'accept',
				payload: {},
				version: g.version,
			} )
		).rejects.toMatchObject( {
			code: 'NOT_YOUR_TURN',
		} );
		await submitMove( db, HOST, {
			gameId,
			kind: 'accept',
			payload: {},
			version: g.version,
		} );
		expect( ( await state() ).snapshot.cube ).toMatchObject( {
			value: 2,
			owner: P1,
			offered: false,
		} );

		const crawford = await started( {
			matchTarget: 3,
			options: { cube: true },
		} );
		crawford.games[ 0 ].scores = { [ P1 ]: 2, [ P2 ]: 0 };
		await finishTurn( crawford.db, crawford.gameId, crawford.state );
		const c = await crawford.state();
		await expect(
			submitMove( crawford.db, GUEST, {
				gameId: crawford.gameId,
				kind: 'double',
				payload: {},
				version: c.version,
			} )
		).rejects.toMatchObject( { code: 'CUBE_NOT_ALLOWED' } );
	} );
} );

type StateFn = () => Promise< { snapshot: GameState; version: number } >;
type Db = ReturnType< typeof memoryDb >[ 'db' ];

/** The player to move plays their first legal step until the turn passes. */
async function finishTurn( db: Db, gameId: string, state: StateFn ) {
	const first = ( await state() ).snapshot.player;
	for ( let i = 0; i < 20; i++ ) {
		const g = await state();
		if ( g.snapshot.phase !== 'moving' || g.snapshot.player !== first )
			return;
		const step = getEngine( g.snapshot.variant ).legalSteps(
			g.snapshot
		)[ 0 ];
		await submitMove( db, userOf( first! ), {
			gameId,
			kind: 'step',
			payload: { step },
			version: g.version,
		} );
	}
}

/** Both players roll and play their first legal step, for up to `turns` moves. */
async function playOut(
	db: Db,
	gameId: string,
	state: StateFn,
	rng: Rng,
	moves: number
) {
	for ( let i = 0; i < moves; i++ ) {
		const g = await state();
		const { phase, player } = g.snapshot;
		if ( phase === 'over' || ! player ) return;
		if ( phase === 'awaiting-roll' ) {
			await submitMove(
				db,
				userOf( player ),
				{ gameId, kind: 'roll', payload: {}, version: g.version },
				rng
			);
		} else {
			const step = getEngine( g.snapshot.variant ).legalSteps(
				g.snapshot
			)[ 0 ];
			await submitMove( db, userOf( player ), {
				gameId,
				kind: 'step',
				payload: { step },
				version: g.version,
			} );
		}
	}
}
