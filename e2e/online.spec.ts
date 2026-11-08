import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Two players in two separate browser sessions play through a room. Needs
 * the local Supabase stack (`npx supabase start`) and its keys in
 * `.env.local`; skipped otherwise.
 */
const supabaseUp = async () => {
	try {
		return ( await fetch( 'http://127.0.0.1:54321/auth/v1/health', { signal: AbortSignal.timeout( 1000 ) } ) ).status < 500;
	} catch {
		return false;
	}
};

type State = { phase: string; player: string | null; checkers: unknown[] };
const game = ( page: Page ): Promise< State > =>
	page.evaluate( () => ( window as any ).__backgammonStore.getState().game.state );
const version = ( page: Page ): Promise< number > =>
	page.evaluate( () => ( window as any ).__backgammonStore.getState().net?.version ?? 0 );

const player = async ( browser: Browser ) => ( await browser.newContext() ).newPage();

/** The player to move rolls if asked, then moves until the turn passes. */
const playTurn = async ( page: Page, me: string ) => {
	for ( let i = 0; i < 40; i++ ) {
		const g = await game( page );
		if ( g.player !== me && i > 0 ) return;
		if ( g.phase === 'awaiting-roll' ) {
			const roll = page.getByRole( 'button', { name: 'Roll' } );
			if ( await roll.count() ) await roll.click();
		} else if ( g.phase === 'moving' && g.player === me ) {
			await page.waitForTimeout( 250 );
			const own = page.locator( `[data-checker][data-player="${ me }"]:not([data-place="off"])` );
			const before = JSON.stringify( g.checkers );
			for ( let k = 0; k < ( await own.count() ); k++ ) {
				await own.nth( k ).click( { force: true } );
				if ( JSON.stringify( ( await game( page ) ).checkers ) !== before ) break;
				const target = page.locator( '[data-target]' ).first();
				if ( await target.count() ) {
					await target.click( { force: true } );
					break;
				}
			}
		}
		await page.waitForTimeout( 300 );
	}
	throw new Error( `${ me } did not finish the turn` );
};

for ( const variant of [ 'Backgammon', 'Triktrak' ] ) {
	test( `two players play a turn each in an online ${ variant } room`, async ( { browser } ) => {
		test.skip( ! ( await supabaseUp() ), 'local Supabase is not running' );
		test.setTimeout( 90000 );
		const host = await player( browser );
		await host.goto( '/' );
		await host.waitForLoadState( 'networkidle' );
		await host.getByRole( 'radio', { name: new RegExp( `^${ variant }` ) } ).click();
		await host.getByRole( 'radio', { name: 'Online' } ).click();
		await host.getByRole( 'button', { name: 'Create room' } ).click();
		await host.waitForURL( '**/room/*' );
		await expect( host.getByText( /waiting for your friend/i ) ).toBeVisible();

		const guest = await player( browser );
		await guest.goto( host.url() );
		await guest.getByLabel( 'Your name' ).fill( 'Anna' );
		await guest.getByRole( 'button', { name: 'Join game' } ).click();
		for ( const page of [ host, guest ] ) {
			await expect( page.getByRole( 'group', { name: 'Backgammon board' } ) ).toBeVisible( { timeout: 20000 } );
		}

		const pages: Record< string, Page > = { PLAYER_ONE: host, PLAYER_TWO: guest };
		for ( let turn = 0; turn < 2; turn++ ) {
			const mover = ( await game( host ) ).player!;
			await playTurn( pages[ mover ], mover );
			// Both tabs agree on the position and the move count.
			await expect.poll( async () => ( await version( host ) ) === ( await version( guest ) ) ).toBe( true );
			await expect
				.poll( async () => JSON.stringify( await game( host ) ) === JSON.stringify( await game( guest ) ) )
				.toBe( true );
			expect( ( await game( host ) ).player ).not.toBe( mover );
		}
	} );
}
