/**
 * CLI: `tsx cli.mts [--start|--midgame] [--watch] [--gentle]`
 */
import { connect, describe, isGameOver, loadMidgame, playRedTurn, readState, startNewGame } from './lib.mts';

const args = process.argv.slice( 2 );
const strength = args.includes( '--gentle' ) ? 'gentle' : 'normal';
const stamp = () => new Date().toISOString().slice( 11, 19 );
const sleep = ( ms: number ) => new Promise( ( r ) => setTimeout( r, ms ) );

const { browser, page } = await connect();
if ( args.includes( '--midgame' ) ) await loadMidgame( page );
else if ( args.includes( '--start' ) ) await startNewGame( page );

const step = async () => {
	const log = await playRedTurn( page, strength );
	log.forEach( ( l ) => console.log( `[${ stamp() }] ${ l }` ) );
	console.log( describe( await readState( page ) ) );
};

if ( args.includes( '--watch' ) ) {
	console.log( `[${ stamp() }] Watching the board as Red (${ strength })…` );
	let lastKey = '';
	for ( ;; ) {
		try {
			const st = await readState( page );
			if ( isGameOver( st ) ) { console.log( `[${ stamp() }] GAME OVER: ${ st.notice }` ); console.log( describe( st ) ); break; }
			if ( st.current === 'PLAYER_TWO' && st.dice.length ) {
				await step();
			} else {
				const key = `${ st.current }|${ st.dice.join( '' ) }|${ st.checkers.map( ( c ) => c.lane ).join( ',' ) }`;
				if ( key !== lastKey ) { console.log( `[${ stamp() }] waiting — Blue to move, dice ${ st.dice.join( '-' ) || '-' }` ); lastKey = key; }
			}
		} catch ( e ) {
			console.log( `[${ stamp() }] error: ${ ( e as Error ).message }` );
		}
		await sleep( 2000 );
	}
} else {
	await step();
}
await browser.close();
