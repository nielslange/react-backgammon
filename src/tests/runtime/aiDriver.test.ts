import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { localAi } from '../../ai/local';
import { makeStore } from '../../data/createStore';
import { acceptDouble, loadSnapshot, newGame, offerDouble } from '../../data/gameSlice';
import { selectNotice } from '../../data/selectors';
import { configureSession } from '../../data/sessionSlice';
import { scripted, seeded } from '../../runtime/rng';
import { createTurnDriver } from '../../runtime/turnDriver';
import { MessageType } from '../../types';
import { onCheckerClick } from '../../ui/moveInput';
import { P1, P2, pos } from '../engine/fixtures';

const vsComputer = ( level: 'easy' | 'medium' | 'hard', dice: number[], matchTarget = 1 ) => {
	const store = makeStore( {
		middleware: [ createTurnDriver( { rng: scripted( dice ), delays: { roll: 0, aiStep: 0 }, ai: localAi } ).middleware ],
	} );
	store.dispatch(
		configureSession( {
			players: { [ P1 ]: { kind: 'human', name: 'Niels' }, [ P2 ]: { kind: 'ai', name: 'Computer', level } },
			matchTarget,
		} )
	);
	return store;
};

describe( 'the turn driver and the computer', () => {
	it( 'plays the computer’s turn and hands back to the human', async () => {
		// Opening 1 (Light) vs 6 (Dark): the computer starts with 6-1, then Light gets 5-3.
		const store = vsComputer( 'hard', [ 1, 6, 5, 3 ] );
		store.dispatch( newGame( { variant: 'backgammon', options: { cube: false } } ) );
		await waitFor( () => expect( store.getState().game.state.player ).toBe( P1 ) );
		await waitFor( () => expect( store.getState().game.state.dice ).toEqual( [ 5, 3 ] ) );
		const dark = store.getState().game.state.checkers.filter( ( c ) => c.player === P2 );
		// 6-1 from the start: the computer makes its bar point (Dark's 7-point is lane 18).
		expect( dark.filter( ( c ) => c.lane === 18 ) ).toHaveLength( 2 );
	} );

	it( 'refuses clicks while the computer is to move', () => {
		const store = vsComputer( 'easy', [ 6, 1 ] );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch(
			loadSnapshot( {
				snapshot: { ...store.getState().game.state, phase: 'moving', player: P2, firstMover: P2, roll: [ 6, 1 ], dice: [ 6, 1 ] },
			} )
		);
		onCheckerClick( store.dispatch, store.getState(), 16 );
		expect( selectNotice( store.getState() ).message ).toBe( MessageType.COMPUTER_TURN );
	} );

	it( 'answers a double offered by the human', async () => {
		const store = vsComputer( 'hard', [ 6, 1, 4, 2 ], 3 );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch(
			loadSnapshot( {
				snapshot: { ...store.getState().game.state, phase: 'awaiting-roll', player: P1, firstMover: P1, roll: null, dice: [] },
			} )
		);
		store.dispatch( offerDouble( { player: P1 } ) );
		await waitFor( () => expect( store.getState().game.state.cube ).toEqual( { value: 2, owner: P2, offered: false } ) );
	} );

	it( 'doubles when far ahead, and the human can take', async () => {
		const store = vsComputer( 'hard', [ 6, 1, 4, 2 ], 3 );
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		store.dispatch(
			loadSnapshot( {
				snapshot: {
					...store.getState().game.state,
					checkers: pos( [ { player: P2, lane: 22, count: 15 }, { player: P1, lane: 14, count: 15 } ] ),
					phase: 'awaiting-roll',
					player: P2,
					firstMover: P1,
					roll: null,
					dice: [],
				},
			} )
		);
		await waitFor( () => expect( store.getState().game.state.cube.offered ).toBe( true ) );
		store.dispatch( acceptDouble() );
		// The computer rolls and plays; then Light, who now owns the cube, may redouble before rolling.
		await waitFor( () => expect( store.getState().game.state.player ).toBe( P1 ) );
		const dark = store.getState().game.state.checkers.filter( ( c ) => c.player === P2 );
		expect( dark.some( ( c ) => c.lane !== 22 ) ).toBe( true );
		expect( store.getState().game.state.cube ).toEqual( { value: 2, owner: P1, offered: false } );
	} );

	it( 'plays a whole Triktrak game against itself', async () => {
		const store = makeStore( {
			middleware: [
				createTurnDriver( {
					rng: seeded( 11 ),
					delays: { roll: 0, aiStep: 0 },
					ai: localAi,
				} ).middleware,
			],
		} );
		store.dispatch(
			configureSession( {
				players: { [ P1 ]: { kind: 'ai', name: 'A', level: 'easy' }, [ P2 ]: { kind: 'ai', name: 'B', level: 'easy' } },
				matchTarget: 1,
			} )
		);
		store.dispatch( newGame( { variant: 'triktrak' } ) );
		await waitFor( () => expect( store.getState().game.state.phase ).toBe( 'over' ), { timeout: 60000 } );
	}, 70000 );
} );
