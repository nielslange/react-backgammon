import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEngine } from '../../engine';
import { createGame } from '../../engine/game';
import type { GameState } from '../../engine/types';
import { applyMove, type LoggedMove } from '../../net/protocol';
import { createSync } from '../../net/sync';

/** A short real game log: opening, then both players move and roll. */
const gameLog = (): {
	initial: GameState;
	moves: LoggedMove[];
	states: GameState[];
} => {
	const initial = createGame( 'backgammon', { cube: false } );
	const moves: LoggedMove[] = [
		{ seq: 1, kind: 'opening', payload: { rolls: [ [ 6, 1 ] ] } },
	];
	let state = applyMove( initial, moves[ 0 ] );
	const states = [ state ];
	const rolls = [
		[ 3, 2 ],
		[ 5, 4 ],
		[ 2, 1 ],
	];
	while ( moves.length < 12 ) {
		const seq = moves.length + 1;
		let move: LoggedMove;
		if ( state.phase === 'awaiting-roll' )
			move = {
				seq,
				kind: 'roll',
				payload: { roll: rolls.shift() ?? [ 6, 5 ] },
			};
		else
			move = {
				seq,
				kind: 'step',
				payload: {
					step: getEngine( 'backgammon' ).legalSteps( state )[ 0 ],
				},
			};
		state = applyMove( state, move );
		moves.push( move );
		states.push( state );
	}
	return { initial, moves, states };
};

describe( 'createSync', () => {
	beforeEach( () => vi.useFakeTimers() );
	afterEach( () => vi.useRealTimers() );

	const setup = () => {
		const log = gameLog();
		const seen: Array< { version: number; snapshot: GameState } > = [];
		const reload = vi.fn( async () => ( {
			version: 12,
			snapshot: log.states[ 11 ],
		} ) );
		const sync = createSync( {
			snapshot: log.states[ 0 ],
			version: 1,
			reload,
			onState: ( snapshot, version ) =>
				seen.push( { snapshot, version } ),
			graceMs: 500,
		} );
		return { log, seen, reload, sync };
	};

	it( 'applies moves in order and ignores duplicates', () => {
		const { log, seen, sync } = setup();
		for ( const move of log.moves.slice( 1 ) ) sync.receive( move );
		sync.receive( log.moves[ 3 ] );
		expect( seen.at( -1 ) ).toEqual( {
			version: 12,
			snapshot: log.states[ 11 ],
		} );
		expect( seen ).toHaveLength( 11 );
	} );

	it( 'reaches the same state when moves arrive out of order, without reloading', async () => {
		const { log, seen, reload, sync } = setup();
		const shuffled = [ ...log.moves.slice( 1 ) ].reverse();
		for ( const move of shuffled ) sync.receive( move );
		await vi.advanceTimersByTimeAsync( 1000 );
		expect( reload ).not.toHaveBeenCalled();
		expect( seen.at( -1 ) ).toEqual( {
			version: 12,
			snapshot: log.states[ 11 ],
		} );
	} );

	it( 'reloads the snapshot once when a move stays missing', async () => {
		const { log, seen, reload, sync } = setup();
		// Move 2 never arrives.
		for ( const move of log.moves.slice( 2 ) ) sync.receive( move );
		expect( seen ).toHaveLength( 0 );
		await vi.advanceTimersByTimeAsync( 600 );
		expect( reload ).toHaveBeenCalledTimes( 1 );
		expect( seen.at( -1 ) ).toEqual( {
			version: 12,
			snapshot: log.states[ 11 ],
		} );
		// Late duplicates after the reload change nothing.
		sync.receive( log.moves[ 1 ] );
		expect( reload ).toHaveBeenCalledTimes( 1 );
		expect( seen.at( -1 )!.version ).toBe( 12 );
	} );

	it( 'reloads when a move does not apply (the copies disagree)', async () => {
		const { log, reload, sync } = setup();
		sync.receive( { seq: 2, kind: 'undo', payload: {} } );
		await vi.advanceTimersByTimeAsync( 0 );
		expect( reload ).toHaveBeenCalledTimes( 1 );
		void log;
	} );

	it( 'stops after close', async () => {
		const { log, seen, reload, sync } = setup();
		sync.close();
		sync.receive( log.moves[ 1 ] );
		sync.receive( log.moves[ 3 ] );
		await vi.advanceTimersByTimeAsync( 1000 );
		expect( seen ).toHaveLength( 0 );
		expect( reload ).not.toHaveBeenCalled();
	} );
} );
