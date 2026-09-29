/**
 * Shared engine + browser driver for the Red bot.
 *
 * The bot never touches the Redux store for moves: it clicks the same UI a
 * human uses, so the rules enforced by the app are the ones being played.
 * Only position loading (mid-game start) goes through the dev store hook.
 */
import { chromium, type Browser, type Page } from 'playwright';
import { execFile } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { PlayerType } from '../../src/types';
import {
	getTargetLane,
	hasWaitingChecker,
	hasCheckersOutsideHomeBoard,
	wouldClearOffChecker,
	calculatePipCount,
} from '../../src/data/selectors';

export type Checker = { id: number; lane: number; player: PlayerType };
export type Step = { lane: number; die: number; target: number };
export type Strength = 'gentle' | 'normal';
export type BoardState = {
	checkers: Checker[];
	current: PlayerType | null;
	dice: number[];
	notice: string;
	pips: { blue: number; red: number };
	mode: string;
};

export const ME = PlayerType.PLAYER_TWO; // Red
export const OPP = PlayerType.PLAYER_ONE; // Blue
export const APP_URL = process.env.BACKGAMMON_URL ?? 'http://localhost:5173';
export const CDP_URL = process.env.BACKGAMMON_CDP ?? 'http://localhost:9222';
const CDP_PORT = new URL( CDP_URL ).port || '9222';
const PROFILE_DIR = join( homedir(), '.cache', 'react-backgammon-chrome' );

// ---------- browser ----------
const reachable = async ( url: string ) => {
	try {
		const res = await fetch( url );
		return res.ok;
	} catch {
		return false;
	}
};

/** Launch a visible Chrome with remote debugging if none is listening. */
export const ensureChrome = async (): Promise< void > => {
	if ( await reachable( `${ CDP_URL }/json/version` ) ) return;
	if ( ! ( await reachable( APP_URL ) ) ) {
		throw new Error( `Dev server not reachable at ${ APP_URL }. Run "pnpm dev" first.` );
	}
	mkdirSync( PROFILE_DIR, { recursive: true } );
	await new Promise< void >( ( resolve, reject ) =>
		execFile(
			'open',
			[
				'-na',
				'Google Chrome',
				'--args',
				`--user-data-dir=${ PROFILE_DIR }`,
				`--remote-debugging-port=${ CDP_PORT }`,
				'--no-first-run',
				'--no-default-browser-check',
				'--window-size=1400,900',
				APP_URL,
			],
			( err ) => ( err ? reject( err ) : resolve() )
		)
	);
	for ( let i = 0; i < 30; i++ ) {
		if ( await reachable( `${ CDP_URL }/json/version` ) ) return;
		await new Promise( ( r ) => setTimeout( r, 500 ) );
	}
	throw new Error( 'Chrome did not expose the remote debugging port in time.' );
};

export const connect = async (): Promise< { browser: Browser; page: Page } > => {
	await ensureChrome();
	const browser = await chromium.connectOverCDP( CDP_URL );
	let page = browser
		.contexts()
		.flatMap( ( c ) => c.pages() )
		.find( ( p ) => p.url().startsWith( APP_URL ) );
	if ( ! page ) {
		page = await browser.contexts()[ 0 ].newPage();
		await page.goto( APP_URL );
	}
	await page.bringToFront();
	await page.waitForSelector( '.board' );
	return { browser, page };
};

// ---------- read state from the DOM ----------
export const readState = async ( page: Page ): Promise< BoardState > => {
	const checkers: Checker[] = await page.$$eval( '.lane', ( lanes ) => {
		const out: any[] = [];
		let synth = 1000;
		for ( const lane of lanes ) {
			const laneNo = Number( ( lane as HTMLElement ).dataset.lane );
			const els = Array.from( lane.querySelectorAll( '.checker' ) ) as HTMLElement[];
			if ( ! els.length ) continue;
			const player = els[ 0 ].dataset.player;
			const countEl = lane.querySelector( '.checker-count' );
			const total = countEl ? Number( countEl.textContent ) : els.length;
			els.forEach( ( e ) => out.push( { id: Number( e.dataset.checker ), lane: laneNo, player } ) );
			for ( let i = els.length; i < total; i++ ) out.push( { id: synth++, lane: laneNo, player } );
		}
		return out;
	} );
	const rows: Record< string, string > = await page.$$eval( 'table tr', ( trs ) => {
		const o: Record< string, string > = {};
		for ( const tr of trs ) {
			const tds = Array.from( tr.querySelectorAll( 'td' ) ).map( ( t ) => t.textContent!.trim() );
			if ( tds.length >= 3 ) o[ tds[ 0 ] ] = tds.slice( 2 ).join( ' ' );
		}
		return o;
	} );
	const currentText = rows.Current ?? '';
	const current = currentText.includes( 'Player 1' ) ? OPP : currentText.includes( 'Player 2' ) ? ME : null;
	const dice: number[] = await page.$$eval( '.dice-tray .die', ( els ) =>
		els.map( ( e ) => Number( ( e as HTMLElement ).dataset.die ) )
	);
	const mode = await page.$eval( '.dice-tray', ( el ) => ( el as HTMLElement ).dataset.mode ?? 'beginner' ).catch( () => 'beginner' );
	const notice = await page.$eval( '.alert', ( el ) => el.textContent!.trim() ).catch( () => '' );
	const pip = ( key: string ) => Number( ( rows[ key ] ?? '' ).replace( /\D/g, '' ) );
	return {
		checkers,
		current,
		dice,
		notice,
		mode,
		pips: { blue: pip( 'Blue (Player 1)' ), red: pip( 'Red (Player 2)' ) },
	};
};

// ---------- rules (mirrors validateMoveHelper.tryMove / applyMove) ----------
const tryMove = ( checkers: Checker[], player: PlayerType, lane: number, die: number ): number | null => {
	const onBar = hasWaitingChecker( { checkers, currentPlayer: player } );
	const barLane = player === OPP ? 0 : 25;
	if ( onBar && lane !== barLane ) return null;
	if ( ! checkers.some( ( c ) => c.player === player && c.lane === lane ) ) return null;
	const target = getTargetLane( { currentPlayer: player, die, lane } );
	const bearingOff = ( player === OPP && target === 25 ) || ( player === ME && target === 0 );
	if ( bearingOff ) {
		if ( hasCheckersOutsideHomeBoard( { checkers, currentPlayer: player } ) ) return null;
		if ( ! wouldClearOffChecker( { die, lane, currentPlayer: player, checkers } ) ) return null;
		return target;
	}
	if ( target < 1 || target > 24 ) return null;
	const opp = checkers.filter( ( c ) => c.player !== player && c.lane === target ).length;
	return opp >= 2 ? null : target;
};

const applyMove = ( checkers: Checker[], player: PlayerType, lane: number, target: number ): Checker[] => {
	const next = checkers.map( ( c ) => ( { ...c } ) );
	const i = next.findIndex( ( c ) => c.player === player && c.lane === lane );
	const victims = next.filter( ( c ) => c.player !== player && c.lane === target );
	if ( victims.length === 1 ) victims[ 0 ].lane = player === OPP ? 25 : 0;
	next[ i ].lane = target;
	return next;
};

const enumerate = ( checkers: Checker[], dice: number[] ): Step[][] => {
	if ( ! dice.length ) return [ [] ];
	const results: Step[][] = [];
	const tried = new Set< number >();
	dice.forEach( ( die, i ) => {
		if ( tried.has( die ) ) return;
		tried.add( die );
		const lanes = [ ...new Set( checkers.filter( ( c ) => c.player === ME ).map( ( c ) => c.lane ) ) ].filter( ( l ) => l !== 0 );
		for ( const lane of lanes ) {
			const target = tryMove( checkers, ME, lane, die );
			if ( target === null ) continue;
			const rest = [ ...dice.slice( 0, i ), ...dice.slice( i + 1 ) ];
			for ( const tail of enumerate( applyMove( checkers, ME, lane, target ), rest ) ) {
				results.push( [ { lane, die, target }, ...tail ] );
			}
		}
	} );
	return results.length ? results : [ [] ];
};

const countHits = ( before: Checker[], after: Checker[] ) =>
	after.filter( ( c ) => c.player === OPP && c.lane === 0 ).length -
	before.filter( ( c ) => c.player === OPP && c.lane === 0 ).length;

/** Normal strength: race + safety + points. */
const scoreNormal = ( checkers: Checker[] ): number => {
	let s = calculatePipCount( { checkers, player: OPP } ) - calculatePipCount( { checkers, player: ME } );
	for ( let lane = 1; lane <= 24; lane++ ) {
		const mine = checkers.filter( ( c ) => c.player === ME && c.lane === lane ).length;
		if ( mine === 1 ) {
			const reachable = checkers.some( ( c ) => c.player === OPP && ( c.lane > lane || c.lane === 0 ) );
			s -= reachable ? 8 : 1;
		} else if ( mine >= 2 ) {
			s += lane >= 19 ? 4 : lane >= 13 ? 3 : 1;
		}
	}
	return s;
};

/**
 * Pick a full turn. Gentle strength avoids hitting when it can, ignores
 * safety and structure, and picks randomly among what is left.
 */
export const chooseTurn = ( checkers: Checker[], dice: number[], strength: Strength = 'normal' ): Step[] => {
	const all = enumerate( checkers, dice );
	const maxLen = Math.max( ...all.map( ( s ) => s.length ) );
	let best = all.filter( ( s ) => s.length === maxLen );
	if ( maxLen === 1 && dice.length === 2 && dice[ 0 ] !== dice[ 1 ] ) {
		const larger = Math.max( ...dice );
		const withLarger = best.filter( ( s ) => s[ 0 ].die === larger );
		if ( withLarger.length ) best = withLarger;
	}
	const finalPos = ( seq: Step[] ) => seq.reduce( ( pos, st ) => applyMove( pos, ME, st.lane, st.target ), checkers );

	if ( strength === 'gentle' ) {
		const peaceful = best.filter( ( seq ) => countHits( checkers, finalPos( seq ) ) === 0 );
		const pool = peaceful.length ? peaceful : best;
		return pool[ Math.floor( Math.random() * pool.length ) ] ?? [];
	}

	let top: Step[] = [];
	let topScore = -Infinity;
	for ( const seq of best ) {
		const sc = scoreNormal( finalPos( seq ) );
		if ( sc > topScore ) { topScore = sc; top = seq; }
	}
	return top;
};

// ---------- act in the browser ----------
/** Beginner mode: checker then highlighted point. Advanced: die then checker. */
export const clickStep = async ( page: Page, step: Step ) => {
	const mode = await page.$eval( '.dice-tray', ( el ) => ( el as HTMLElement ).dataset.mode );
	const checkerSel = step.lane === 25
		? '.lane.bar[data-lane="25"] .checker[data-player="PLAYER_TWO"]'
		: `.lane[data-lane="${ step.lane }"]:not(.off) .checker[data-player="PLAYER_TWO"]`;
	if ( mode === 'advanced' ) {
		const dieButton = `button.die[data-die="${ step.die }"]:not([disabled])`;
		if ( ! ( await page.$( dieButton ) ) ) throw new Error( `Die ${ step.die } is not selectable` );
		await page.click( dieButton );
		await page.click( checkerSel );
	} else {
		await page.click( checkerSel );
		const previewed = await readState( page );
		if ( ! /^Click a highlighted point/.test( previewed.notice ) ) {
			throw new Error( `Preview of ${ step.lane }→${ step.target } rejected: ${ previewed.notice }` );
		}
		const targetSel = step.target === 0
			? '.lane.off[data-lane="0"].lane--target'
			: `.lane[data-lane="${ step.target }"].lane--target:not(.bar)`;
		await page.click( targetSel );
	}
	const after = await readState( page );
	if ( ! /^Moved/.test( after.notice ) ) throw new Error( `Move ${ step.lane }→${ step.target } rejected: ${ after.notice }` );
	return after;
};

const fmt = ( st: Step ) => `${ st.lane === 25 ? 'bar' : st.lane }→${ st.target === 0 ? 'off' : st.target } (${ st.die })`;

/** Play Red's whole turn if it is Red's turn. Returns a log of what happened. */
export const playRedTurn = async ( page: Page, strength: Strength = 'normal' ): Promise< string[] > => {
	const log: string[] = [];
	const st = await readState( page );
	if ( st.current !== ME || ! st.dice.length ) {
		log.push( st.current === OPP ? 'Not my turn: Blue to move.' : 'Game not started or no dice.' );
		return log;
	}
	const plan = chooseTurn( st.checkers, st.dice, strength );
	log.push( `Red rolls ${ st.dice.join( '-' ) }. Plan: ${ plan.map( fmt ).join( ', ' ) || 'no legal move' }` );
	for ( const step of plan ) {
		const after = await clickStep( page, step );
		log.push( `  played ${ fmt( step ) }: ${ after.notice }` );
		if ( after.current !== ME ) break;
	}
	return log;
};

// ---------- positions ----------
export const startNewGame = async ( page: Page ) => {
	await page.reload();
	await page.waitForSelector( '.board' );
	await page.click( 'button[aria-label="Restart the game"]' );
	await page.click( 'button[aria-label="Toggle the current player"]' );
};

/**
 * A balanced middle-game position. Blue (to move) is a little ahead in the
 * race; both sides hold an anchor in the other's home board.
 */
export const MIDGAME: Array< { player: PlayerType; lane: number; count: number } > = [
	{ player: OPP, lane: 6, count: 3 },
	{ player: OPP, lane: 7, count: 2 },
	{ player: OPP, lane: 4, count: 2 },
	{ player: OPP, lane: 8, count: 3 },
	{ player: OPP, lane: 13, count: 3 },
	{ player: OPP, lane: 20, count: 2 },
	{ player: ME, lane: 19, count: 3 },
	{ player: ME, lane: 21, count: 2 },
	{ player: ME, lane: 22, count: 1 },
	{ player: ME, lane: 17, count: 3 },
	{ player: ME, lane: 12, count: 3 },
	{ player: ME, lane: 5, count: 2 },
	{ player: ME, lane: 1, count: 1 },
];

/** A point can hold one colour only; 15 checkers per side. */
export const assertLegalLayout = ( layout: typeof MIDGAME ) => {
	const byLane = new Map< number, Set< PlayerType > >();
	const totals: Record< string, number > = {};
	for ( const { player, lane, count } of layout ) {
		totals[ player ] = ( totals[ player ] ?? 0 ) + count;
		if ( lane >= 1 && lane <= 24 ) {
			byLane.set( lane, ( byLane.get( lane ) ?? new Set() ).add( player ) );
		}
	}
	for ( const [ lane, players ] of byLane ) {
		if ( players.size > 1 ) throw new Error( `Illegal layout: both colours on point ${ lane }` );
	}
	for ( const player of [ OPP, ME ] ) {
		if ( totals[ player ] !== 15 ) throw new Error( `Illegal layout: ${ player } has ${ totals[ player ] ?? 0 } checkers` );
	}
};
assertLegalLayout( MIDGAME );

export const loadMidgame = async ( page: Page ) => {
	await page.reload();
	await page.waitForSelector( '.board' );
	const d1 = Math.floor( Math.random() * 6 ) + 1;
	const d2 = Math.floor( Math.random() * 6 ) + 1;
	const dice = d1 === d2 ? [ d1, d1, d1, d1 ] : [ Math.max( d1, d2 ), Math.min( d1, d2 ) ];
	await page.evaluate(
		( { layout, dice } ) => {
			const checkers: any[] = [];
			let id = 1;
			for ( const { player, lane, count } of layout ) {
				for ( let i = 0; i < count; i++ ) checkers.push( { id: id++, player, lane } );
			}
			( window as any ).__backgammonStore.dispatch( {
				type: 'LOAD_GAME',
				checkers,
				currentPlayer: 'PLAYER_ONE',
				dice,
			} );
		},
		{ layout: MIDGAME, dice }
	);
};

// ---------- text rendering ----------
export const describe = ( st: BoardState ) => {
	const { checkers } = st;
	const cell = ( lane: number ) => {
		const b = checkers.filter( ( c ) => c.lane === lane && c.player === OPP ).length;
		const r = checkers.filter( ( c ) => c.lane === lane && c.player === ME ).length;
		return b ? `${ b }B` : r ? `${ r }R` : '·';
	};
	const line = ( lanes: number[] ) => lanes.map( ( l ) => `${ String( l ).padStart( 2 ) }:${ cell( l ).padEnd( 3 ) }` ).join( ' ' );
	const top = Array.from( { length: 12 }, ( _, i ) => 13 + i );
	const bottom = Array.from( { length: 12 }, ( _, i ) => 12 - i );
	const barB = checkers.filter( ( c ) => c.player === OPP && c.lane === 0 ).length;
	const barR = checkers.filter( ( c ) => c.player === ME && c.lane === 25 ).length;
	const offB = checkers.filter( ( c ) => c.player === OPP && c.lane === 25 ).length;
	const offR = checkers.filter( ( c ) => c.player === ME && c.lane === 0 ).length;
	const turn = st.current === ME ? 'Red (Claude)' : st.current === OPP ? 'Blue (you)' : 'not started';
	return [
		`Turn: ${ turn } | dice: ${ st.dice.join( '-' ) || '-' } | mode: ${ st.mode }`,
		`Notice: ${ st.notice }`,
		`Pips: Blue ${ st.pips.blue }, Red ${ st.pips.red }`,
		line( top ),
		line( bottom ),
		`bar: Blue ${ barB }, Red ${ barR } | off: Blue ${ offB }, Red ${ offR }`,
	].join( '\n' );
};

export const isGameOver = ( st: BoardState ) => /wins!/.test( st.notice );
