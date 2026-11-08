/**
 * Dutch Triktrak rules.
 */
import { describe, expect, it } from 'vitest';
import { getEngine } from '../../engine';
import { expandRoll, isDouble, isTricTrac } from '../../engine/triktrak/rolls';
import { DEFAULT_OPTIONS } from '../../engine/types';
import type { GameState } from '../../engine/types';
import { P1, P2, pos, stateWith } from './fixtures';

const triktrak = getEngine( 'triktrak' );

const tt = ( partial: Partial< GameState > ): GameState =>
	stateWith( { variant: 'triktrak', ...partial } );

/** Both players fully entered and spread out, nothing blocked near P1. */
const spread = () =>
	pos( [
		{ player: P1, lane: 24, count: 2 },
		{ player: P1, lane: 20, count: 2 },
		{ player: P1, lane: 16, count: 2 },
		{ player: P1, lane: 13, count: 3 },
		{ player: P1, lane: 11, count: 2 },
		{ player: P1, lane: 9, count: 2 },
		{ player: P1, lane: 7, count: 2 },
		{ player: P2, lane: 1, count: 3 },
		{ player: P2, lane: 3, count: 3 },
		{ player: P2, lane: 5, count: 3 },
		{ player: P2, lane: 6, count: 3 },
		{ player: P2, lane: 8, count: 3 },
	] );

describe( 'Triktrak rolls', () => {
	it( 'recognises doubles and the tric trac', () => {
		expect( isDouble( [ 4, 4 ] ) ).toBe( true );
		expect( isDouble( [ 4, 3 ] ) ).toBe( false );
		expect( isTricTrac( [ 1, 2 ] ) ).toBe( true );
		expect( isTricTrac( [ 2, 1 ] ) ).toBe( true );
		expect( isTricTrac( [ 1, 1 ] ) ).toBe( false );
	} );

	it( 'expands doubles to n, n, 7-n, 7-n', () => {
		expect( expandRoll( [ 2, 2 ] ) ).toEqual( [ 2, 2, 5, 5 ] );
		expect( expandRoll( [ 6, 6 ] ) ).toEqual( [ 6, 6, 1, 1 ] );
	} );

	it( 'expands a tric trac to 1, 1, 2, 2, 5, 5, 6, 6', () => {
		expect( expandRoll( [ 2, 1 ] ) ).toEqual( [ 1, 1, 2, 2, 5, 5, 6, 6 ] );
	} );

	it( 'plays other rolls high die first', () => {
		expect( expandRoll( [ 3, 5 ] ) ).toEqual( [ 5, 3 ] );
	} );

	it( 'is wired as an engine with ordered dice and no cube', () => {
		expect( triktrak.id ).toBe( 'triktrak' );
		expect( triktrak.orderedDice ).toBe( true );
		expect( triktrak.supportsCube ).toBe( false );
		expect( triktrak.expandRoll( [ 1, 2 ], DEFAULT_OPTIONS ) ).toHaveLength( 8 );
	} );
} );

describe( 'Triktrak ordered play', () => {
	it( 'only offers steps with the next die', () => {
		const state = tt( { checkers: spread(), player: P1, dice: [ 5, 3 ] } );
		const steps = triktrak.legalSteps( state );
		expect( steps.length ).toBeGreaterThan( 0 );
		expect( steps.every( ( s ) => s.die === 5 ) ).toBe( true );
	} );

	it( 'prefers a first step that lets the next die be played', () => {
		// P1 only on 13 and 10; P2 holds 9 and 4. Dice 3 then 5:
		// 13→10 then 10→5 works; 10→7 then 7→2 works too; nothing strands.
		// Make 10→7 strand the 5: 7-5 = 2 is held by P2, and 13-5 = 8 too.
		const checkers = pos( [
			{ player: P1, lane: 13, count: 1 },
			{ player: P1, lane: 10, count: 1 },
			{ player: P1, lane: 25, count: 13 },
			{ player: P2, lane: 2, count: 2 },
			{ player: P2, lane: 8, count: 2 },
			{ player: P2, lane: 0, count: 11 },
		] );
		const steps = triktrak.legalSteps( tt( { checkers, player: P1, dice: [ 3, 5 ] } ) );
		expect( steps.map( ( s ) => s.from ) ).toEqual( [ 13 ] );
	} );

	it( 'finds the legal steps of a tric trac instantly from a busy position', () => {
		const state = tt( { checkers: spread(), player: P1, dice: expandRoll( [ 1, 2 ] ) } );
		const started = performance.now();
		const steps = triktrak.legalSteps( state );
		expect( performance.now() - started ).toBeLessThan( 100 );
		expect( steps.length ).toBeGreaterThan( 0 );
		expect( steps.every( ( s ) => s.die === 1 ) ).toBe( true );
	} );

	it( 'lists every distinct tric trac outcome, each playing all eight dice', () => {
		const state = tt( { checkers: spread(), player: P1, dice: expandRoll( [ 1, 2 ] ) } );
		const turns = triktrak.legalTurns( state );
		const firstSteps = triktrak.legalSteps( state ).map( ( s ) => s.from );
		expect( turns.length ).toBeGreaterThan( 1000 );
		expect( turns.every( ( t ) => t.length === 8 ) ).toBe( true );
		expect( turns.every( ( t ) => firstSteps.includes( t[ 0 ].from ) ) ).toBe( true );
	}, 10000 );
} );

describe( 'Triktrak entry and options', () => {
	it( 'starts with all fifteen checkers of each player off the board', () => {
		const checkers = triktrak.initialCheckers();
		expect( checkers.filter( ( c ) => c.player === P1 && c.lane === 0 ) ).toHaveLength( 15 );
		expect( checkers.filter( ( c ) => c.player === P2 && c.lane === 25 ) ).toHaveLength( 15 );
		const state = tt( { checkers } );
		expect( triktrak.pipCount( state, P1 ) ).toBe( 375 );
		expect( triktrak.pipCount( state, P2 ) ).toBe( 375 );
	} );

	it( 'enters by die value into the opponent home board', () => {
		const state = tt( { checkers: triktrak.initialCheckers(), player: P1, dice: [ 5, 3 ], roll: [ 5, 3 ] } );
		expect( triktrak.legalSteps( state ).map( ( s ) => [ s.from, s.to ] ) ).toEqual( [ [ 0, 20 ] ] );
		const p2 = tt( { checkers: triktrak.initialCheckers(), player: P2, dice: [ 5, 3 ], roll: [ 5, 3 ] } );
		expect( triktrak.legalSteps( p2 ).map( ( s ) => [ s.from, s.to ] ) ).toEqual( [ [ 25, 5 ] ] );
	} );

	it( 'lets entered checkers move while others still wait to enter', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 10 },
			{ player: P1, lane: 18, count: 5 },
			{ player: P2, lane: 25, count: 15 },
		] );
		const steps = triktrak.legalSteps( tt( { checkers, player: P1, dice: [ 4, 2 ], roll: [ 4, 2 ] } ) );
		expect( steps.map( ( s ) => s.from ).sort( ( a, b ) => a - b ) ).toEqual( [ 0, 18 ] );
	} );

	it( 'respects maxCheckersPerPoint', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 13 },
			{ player: P1, lane: 20, count: 2 },
			{ player: P2, lane: 25, count: 15 },
		] );
		const options = { ...DEFAULT_OPTIONS, maxCheckersPerPoint: 2 };
		const state = tt( { checkers, player: P1, dice: [ 5, 2 ], roll: [ 5, 2 ], options } );
		// 0→20 would put a third checker on 20; 20→15 is fine.
		expect( triktrak.legalSteps( state ).map( ( s ) => [ s.from, s.to ] ) ).toEqual( [ [ 20, 15 ] ] );
	} );

	it( 'with enterOnlyOnDoubles, enters only on a double or a tric trac', () => {
		const options = { ...DEFAULT_OPTIONS, enterOnlyOnDoubles: true };
		const checkers = pos( [
			{ player: P1, lane: 0, count: 14 },
			{ player: P1, lane: 18, count: 1 },
			{ player: P2, lane: 25, count: 15 },
		] );
		const plain = tt( { checkers, player: P1, dice: [ 5, 3 ], roll: [ 5, 3 ], options } );
		expect( triktrak.legalSteps( plain ).every( ( s ) => s.from !== 0 ) ).toBe( true );
		const double = tt( { checkers, player: P1, dice: [ 4, 4, 3, 3 ], roll: [ 4, 4 ], options } );
		expect( triktrak.legalSteps( double ).some( ( s ) => s.from === 0 ) ).toBe( true );
		const tric = tt( { checkers, player: P1, dice: expandRoll( [ 1, 2 ] ), roll: [ 1, 2 ], options } );
		expect( triktrak.legalSteps( tric ).some( ( s ) => s.from === 0 ) ).toBe( true );
	} );

	it( 'still sends a hit checker to the bar', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 14 },
			{ player: P1, lane: 9, count: 1 },
			{ player: P2, lane: 25, count: 14 },
			{ player: P2, lane: 4, count: 1 },
		] );
		const state = tt( { checkers, player: P1, dice: [ 5, 1 ], roll: [ 5, 1 ] } );
		const step = triktrak.legalSteps( state ).find( ( s ) => s.from === 9 )!;
		expect( step.hit ).toBe( true );
		const after = triktrak.applyStep( state, step );
		expect( after.checkers.filter( ( c ) => c.player === P2 && c.lane === 25 ) ).toHaveLength( 15 );
	} );
} );

/** Play the first legal step until the turn or sequence ends. */
const playOut = ( state: GameState ): GameState => {
	let s = state;
	while ( s.phase === 'moving' && s.player === state.player && s.dice.length ) {
		const step = triktrak.legalSteps( s )[ 0 ];
		if ( ! step ) break;
		s = triktrak.afterStep( triktrak.applyStep( s, step ) );
	}
	return s;
};

const rolled = ( checkers: ReturnType< typeof pos >, roll: [ number, number ], extra: Partial< GameState > = {} ) =>
	triktrak.onRoll( tt( { checkers, player: P1, phase: 'awaiting-roll', ...extra } ), roll );

/** P1: one checker on `from` (13 by default), the rest borne off; P2 waits on its bar. */
const lone = ( p2Points: number[], from = 13 ) =>
	pos( [
		{ player: P1, lane: from, count: 1 },
		{ player: P1, lane: 25, count: 14 },
		...p2Points.map( ( lane ) => ( { player: P2, lane, count: 2 } ) ),
		{ player: P2, lane: 25, count: 15 - 2 * p2Points.length },
	] );

describe( 'Triktrak forfeits and re-rolls', () => {
	it( 'passes the whole turn when the high die cannot be played, even if the low one could', () => {
		const checkers = lone( [ 7 ] ); // 13-6 = 7 is held; 13-2 = 11 is open
		const s = rolled( checkers, [ 6, 2 ] );
		expect( s.player ).toBe( P2 );
		expect( s.lastEvent ).toBe( 'forfeit' );
		expect( s.checkers ).toEqual( checkers );
	} );

	it( 'forfeits the low die when it is blocked after the high one', () => {
		const s = playOut( rolled( lone( [ 5 ] ), [ 6, 2 ] ) ); // 13→7, then 7-2 = 5 is held
		expect( s.player ).toBe( P2 );
		expect( s.lastEvent ).toBe( 'forfeit' );
		expect( s.checkers.find( ( c ) => c.player === P1 && c.lane < 25 )?.lane ).toBe( 7 );
	} );

	it( 'a blocked step in a double forfeits the rest and earns no re-roll', () => {
		// 2-2 plays 2, 2, 5, 5: 13→11→9, then 9-5 = 4 is held.
		const s = playOut( rolled( lone( [ 4 ] ), [ 2, 2 ] ) );
		expect( s.player ).toBe( P2 );
		expect( s.lastEvent ).toBe( 'forfeit' );
		expect( s.rerolls ).toBe( 0 );
	} );

	it( 'a completed double earns another roll for the same player', () => {
		// From 20 a 2-2 (2, 2, 5, 5 = 14 pips) keeps the checker on the board.
		const s = playOut( rolled( lone( [], 20 ), [ 2, 2 ] ) );
		expect( s.player ).toBe( P1 );
		expect( s.phase ).toBe( 'awaiting-roll' );
		expect( s.lastEvent ).toBe( 'reroll' );
		expect( s.rerolls ).toBe( 1 );
		expect( s.dice ).toEqual( [] );
	} );

	it( 'a completed tric trac earns another roll', () => {
		const checkers = pos( [
			{ player: P1, lane: 24, count: 3 },
			{ player: P1, lane: 0, count: 12 },
			{ player: P2, lane: 25, count: 15 },
		] );
		const s = playOut( rolled( checkers, [ 1, 2 ] ) );
		expect( s.player ).toBe( P1 );
		expect( s.lastEvent ).toBe( 'reroll' );
	} );

	it( 'rerollLimit stops further bonus rolls and resets the count on hand-off', () => {
		const options = { ...DEFAULT_OPTIONS, rerollLimit: 1 };
		const s = playOut( rolled( lone( [], 20 ), [ 2, 2 ], { options, rerolls: 1 } ) );
		expect( s.player ).toBe( P2 );
		expect( s.lastEvent ).toBe( 'hand-off' );
		expect( s.rerolls ).toBe( 0 );
	} );

	it( 'without rerollOnlyIfCompleted a blocked double still earns a re-roll', () => {
		const options = { ...DEFAULT_OPTIONS, rerollOnlyIfCompleted: false };
		const s = playOut( rolled( lone( [ 4 ] ), [ 2, 2 ], { options } ) );
		expect( s.player ).toBe( P1 );
		expect( s.lastEvent ).toBe( 'reroll' );
	} );

	it( 'a normal roll played in full hands the turn over', () => {
		const s = playOut( rolled( lone( [] ), [ 5, 3 ] ) );
		expect( s.player ).toBe( P2 );
		expect( s.lastEvent ).toBe( 'hand-off' );
	} );
} );

describe( 'Triktrak final turn and draw', () => {
	/** P1 (first mover) has one checker left on 2; P2 is spread over its home. */
	const endgame = ( p2: Array< { lane: number; count: number } >, extra: Partial< GameState > = {} ) =>
		tt( {
			checkers: pos( [
				{ player: P1, lane: 2, count: 1 },
				{ player: P1, lane: 25, count: 14 },
				...p2.map( ( p ) => ( { player: P2, ...p } ) ),
				{ player: P2, lane: 0, count: 15 - p2.reduce( ( n, p ) => n + p.count, 0 ) },
			] ),
			player: P1,
			firstMover: P1,
			roll: [ 3, 1 ],
			dice: [ 3, 1 ],
			...extra,
		} );

	const bearOffLast = ( state: GameState ) =>
		triktrak.afterStep( triktrak.applyStep( state, triktrak.legalSteps( state )[ 0 ] ) );

	it( 'gives the second player one final roll when the first mover finishes', () => {
		const s = bearOffLast( endgame( [ { lane: 23, count: 2 } ] ) );
		expect( s.phase ).toBe( 'awaiting-roll' );
		expect( s.player ).toBe( P2 );
		expect( s.result ).toBeNull();
		expect( s.lastEvent ).toBe( 'final-turn' );
	} );

	it( 'is a draw when the second player also bears off everything', () => {
		const final = bearOffLast( endgame( [ { lane: 23, count: 2 } ] ) );
		const s = playOut( triktrak.onRoll( final, [ 3, 2 ] ) );
		expect( s.phase ).toBe( 'over' );
		expect( s.result ).toEqual( { winner: null, points: 0, kind: 'draw' } );
	} );

	it( 'the first mover wins when the final roll does not finish', () => {
		const final = bearOffLast( endgame( [ { lane: 19, count: 3 } ] ) );
		const s = playOut( triktrak.onRoll( final, [ 4, 3 ] ) );
		expect( s.phase ).toBe( 'over' );
		expect( s.result ).toEqual( { winner: P1, points: 1, kind: 'single' } );
	} );

	it( 'the final turn earns no bonus roll, even for a completed double', () => {
		// 1-1 plays 1, 1, 6, 6: four checkers off from 24 and 19, but one remains.
		const final = bearOffLast( endgame( [ { lane: 24, count: 2 }, { lane: 19, count: 3 } ] ) );
		const s = playOut( triktrak.onRoll( final, [ 1, 1 ] ) );
		expect( s.phase ).toBe( 'over' );
		expect( s.result?.winner ).toBe( P1 );
	} );

	it( 'an unplayable final roll ends the game for the first mover', () => {
		// P2's last checker waits on the bar and may only enter on doubles.
		const options = { ...DEFAULT_OPTIONS, enterOnlyOnDoubles: true };
		const state = tt( {
			checkers: pos( [
				{ player: P1, lane: 2, count: 1 },
				{ player: P1, lane: 25, count: 14 },
				{ player: P2, lane: 25, count: 1 },
				{ player: P2, lane: 0, count: 14 },
			] ),
			player: P1,
			firstMover: P1,
			roll: [ 3, 1 ],
			dice: [ 3, 1 ],
			options,
		} );
		const final = bearOffLast( state );
		expect( final.player ).toBe( P2 );
		const s = triktrak.onRoll( final, [ 5, 3 ] );
		expect( s.phase ).toBe( 'over' );
		expect( s.result ).toEqual( { winner: P1, points: 1, kind: 'single' } );
	} );

	it( 'the second player wins at once when they finish first', () => {
		const s = bearOffLast(
			tt( {
				checkers: pos( [
					{ player: P2, lane: 23, count: 1 },
					{ player: P2, lane: 0, count: 14 },
					{ player: P1, lane: 2, count: 3 },
					{ player: P1, lane: 25, count: 12 },
				] ),
				player: P2,
				firstMover: P1,
				roll: [ 3, 1 ],
				dice: [ 3, 1 ],
			} )
		);
		expect( s.phase ).toBe( 'over' );
		expect( s.result ).toEqual( { winner: P2, points: 1, kind: 'single' } );
	} );

	it( 'without finalTurnForSecondPlayer the first mover wins at once', () => {
		const options = { ...DEFAULT_OPTIONS, finalTurnForSecondPlayer: false };
		const s = bearOffLast( endgame( [ { lane: 23, count: 2 } ], { options } ) );
		expect( s.phase ).toBe( 'over' );
		expect( s.result ).toEqual( { winner: P1, points: 1, kind: 'single' } );
	} );
} );
