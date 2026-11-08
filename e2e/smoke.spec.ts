import { expect, test, type Page } from '@playwright/test';

type Game = { phase: string; player: string | null; dice: number[]; checkers: { id: number; lane: number }[] };

const game = ( page: Page ): Promise< Game > =>
	page.evaluate( () => ( window as any ).__backgammonStore.getState().game.state );

const startLocalGame = async ( page: Page ) => {
	await page.goto( '/' );
	await page.waitForLoadState( 'networkidle' );
	await page.getByRole( 'button', { name: 'Start game' } ).click();
	await page.waitForURL( '**/game' );
	await expect( page.getByRole( 'group', { name: 'Backgammon board' } ) ).toBeVisible();
	await expect.poll( async () => ( await game( page ) ).phase ).toBe( 'moving' );
};

/** Click own checkers until one shows a landing point; return both. */
const previewSomeChecker = async ( page: Page ) => {
	const { player } = await game( page );
	const own = page.locator( `[data-checker][data-player="${ player }"]:not([data-place="off"])` );
	for ( let i = 0; i < ( await own.count() ); i++ ) {
		await own.nth( i ).click( { force: true } );
		const target = page.locator( '[data-target]' ).first();
		if ( await target.count() ) return { checker: own.nth( i ), target };
	}
	throw new Error( 'no checker could move' );
};

test( 'plays one move by click and one by drag, then the opponent gets dice', async ( { page } ) => {
	await startLocalGame( page );
	const mover = ( await game( page ) ).player;

	const before = JSON.stringify( ( await game( page ) ).checkers );
	const first = await previewSomeChecker( page );
	await first.target.click( { force: true } );
	await expect.poll( async () => JSON.stringify( ( await game( page ) ).checkers ) ).not.toBe( before );

	const afterClick = JSON.stringify( ( await game( page ) ).checkers );
	const second = await previewSomeChecker( page );
	// Checkers glide for 180 ms after a move; measure once two samples
	// 150 ms apart agree.
	let from = ( await second.checker.boundingBox() )!;
	for ( let i = 0; i < 20; i++ ) {
		await page.waitForTimeout( 150 );
		const now = ( await second.checker.boundingBox() )!;
		if ( now.x === from.x && now.y === from.y ) break;
		from = now;
	}
	const to = ( await second.target.boundingBox() )!;
	await page.mouse.click( 2, 2 );
	await page.mouse.move( from.x + from.width / 2, from.y + from.height / 2 );
	await page.mouse.down();
	await page.mouse.move( to.x + to.width / 2, to.y + to.height / 2, { steps: 10 } );
	await page.mouse.up();
	await expect.poll( async () => JSON.stringify( ( await game( page ) ).checkers ) ).not.toBe( afterClick );

	await expect.poll( async () => ( await game( page ) ).player ).not.toBe( mover );
	await expect.poll( async () => ( await game( page ) ).dice.length ).toBeGreaterThan( 0 );
	await expect( page.getByRole( 'img', { name: /^Die showing/ } ).first() ).toBeVisible();
} );

test( 'fits the viewport without horizontal scrolling', async ( { page } ) => {
	await startLocalGame( page );
	for ( const path of [ '/game', '/' ] ) {
		if ( path === '/' ) await page.goto( '/' );
		const { scrollWidth, innerWidth } = await page.evaluate( () => ( {
			scrollWidth: document.documentElement.scrollWidth,
			innerWidth: window.innerWidth,
		} ) );
		expect( scrollWidth ).toBeLessThanOrEqual( innerWidth );
	}
	const board = await page.goto( '/game' ).then( () => page.getByRole( 'group', { name: 'Backgammon board' } ).boundingBox() );
	const width = page.viewportSize()!.width;
	if ( width < 1024 ) {
		// Phones: the board spans the page minus the 16px gutters.
		expect( Math.round( board!.width ) ).toBe( width - 32 );
	}
} );

test( 'applies a saved dark theme before the app hydrates (no light flash)', async ( { page } ) => {
	await page.addInitScript( () => {
		try {
			localStorage.setItem( 'backgammon-theme', 'dark' );
		} catch {
			// storage blocked
		}
	} );
	// Without the app bundles nothing hydrates: only an inline script can act.
	await page.route( '**/_next/static/chunks/**', ( route ) => route.abort() );
	await page.goto( '/' );
	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-theme', 'dark' );
} );

test( 'starts a Triktrak game and plays the opening roll', async ( { page } ) => {
	await page.goto( '/' );
	await page.waitForLoadState( 'networkidle' );
	await page.getByRole( 'radio', { name: /triktrak/i } ).click();
	await page.getByRole( 'button', { name: 'Start game' } ).click();
	await page.waitForURL( '**/game' );
	await expect.poll( async () => ( await game( page ) ).phase ).toBe( 'moving' );
	const { player } = await game( page );
	// Every checker starts on the bar, so the first move is an entry.
	const before = JSON.stringify( ( await game( page ) ).checkers );
	const first = await previewSomeChecker( page );
	await first.target.click( { force: true } );
	await expect.poll( async () => JSON.stringify( ( await game( page ) ).checkers ) ).not.toBe( before );
	const after = await page.evaluate( () => ( window as any ).__backgammonStore.getState().game.state );
	expect( after.variant ).toBe( 'triktrak' );
	expect( after.waiting[ player! ] ).toBe( 14 );
} );

test( 'the computer answers with its own move', async ( { page } ) => {
	await page.goto( '/' );
	await page.waitForLoadState( 'networkidle' );
	await page.getByRole( 'radio', { name: 'Computer' } ).click();
	await page.getByRole( 'radio', { name: 'Easy' } ).click();
	await page.getByRole( 'button', { name: 'Start game' } ).click();
	await page.waitForURL( '**/game' );
	// Whoever starts, the computer (Dark) must get to move at least once.
	const darkMoved = async () => {
		const g = await game( page );
		return ( g.checkers as Array< { player: string; lane: number } > )
			.filter( ( c ) => c.player === 'PLAYER_TWO' )
			.map( ( c ) => c.lane )
			.sort( ( a, b ) => a - b )
			.join( ',' );
	};
	const startDark = await darkMoved();
	for ( let i = 0; i < 20 && ( await darkMoved() ) === startDark; i++ ) {
		const g = await game( page );
		if ( g.player === 'PLAYER_ONE' && g.phase === 'moving' ) {
			const move = await previewSomeChecker( page );
			await move.target.click( { force: true } );
		}
		await page.waitForTimeout( 400 );
	}
	expect( await darkMoved() ).not.toBe( startDark );
} );
