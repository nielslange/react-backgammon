import { expect, test, type Page } from '@playwright/test';

type Game = { phase: string; player: string | null; dice: number[]; checkers: { id: number; lane: number }[] };

const game = ( page: Page ): Promise< Game > =>
	page.evaluate( () => ( window as any ).__backgammonStore.getState().game.state );

const startLocalGame = async ( page: Page ) => {
	await page.goto( '/' );
	await page.waitForLoadState( 'networkidle' );
	await page.getByRole( 'radio', { name: /backgammon/i } ).click();
	await page.getByRole( 'radio', { name: 'Local' } ).click();
	await page.getByRole( 'button', { name: 'Start game' } ).click();
	await page.waitForURL( '**/game' );
	await expect( page.getByRole( 'group', { name: 'Backgammon board' } ) ).toBeVisible();
	await expect.poll( async () => ( await game( page ) ).phase ).toBe( 'moving' );
};

/** Click own checkers until one moves: at once (one landing point) or via a highlighted point. */
const moveSomeChecker = async ( page: Page ) => {
	const { player } = await game( page );
	const own = page.locator( `[data-checker][data-player="${ player }"]:not([data-place="off"])` );
	const before = JSON.stringify( ( await game( page ) ).checkers );
	for ( let i = 0; i < ( await own.count() ); i++ ) {
		await own.nth( i ).click( { force: true } );
		if ( JSON.stringify( ( await game( page ) ).checkers ) !== before ) return;
		const target = page.locator( '[data-target]' ).first();
		if ( await target.count() ) {
			await target.click( { force: true } );
			return;
		}
	}
	throw new Error( 'no checker could move' );
};

/** Light to play 5-3 from the starting position. */
const lightPlays53 = ( page: Page ) =>
	page.evaluate( () => {
		const store = ( window as any ).__backgammonStore;
		const g = store.getState().game.state;
		store.dispatch( {
			type: 'game/loadSnapshot',
			payload: {
				snapshot: { ...g, phase: 'moving', player: 'PLAYER_ONE', firstMover: 'PLAYER_ONE', roll: [ 5, 3 ], dice: [ 5, 3 ], turnSteps: [] },
			},
		} );
	} );

/** Wait until a checker's glide (180 ms) has finished; return its box. */
const settledBox = async ( page: Page, selector: string ) => {
	const el = page.locator( selector );
	let box = ( await el.boundingBox() )!;
	for ( let i = 0; i < 20; i++ ) {
		await page.waitForTimeout( 150 );
		const now = ( await el.boundingBox() )!;
		if ( now.x === box.x && now.y === box.y ) break;
		box = now;
	}
	return box;
};

test( 'plays one move by click and one by drag, then the opponent gets dice', async ( { page } ) => {
	await startLocalGame( page );
	await lightPlays53( page );

	// A checker on 13 can land on 8 or 10: click it, then choose 8.
	const top13 = async () =>
		page.evaluate( () =>
			Math.max(
				...( window as any ).__backgammonStore
					.getState()
					.game.state.checkers.filter( ( c: { player: string; lane: number } ) => c.player === 'PLAYER_ONE' && c.lane === 13 )
					.map( ( c: { id: number } ) => c.id )
			)
		);
	await page.locator( `[data-checker="${ await top13() }"]` ).click( { force: true } );
	await expect( page.locator( '[data-target]' ) ).toHaveCount( 2 );
	await page.locator( '[data-target="8"]' ).click( { force: true } );
	await expect.poll( async () => ( await game( page ) ).dice ).toEqual( [ 3 ] );

	// Drag the next checker from 13 to 10 with the 3.
	const id = await top13();
	const from = await settledBox( page, `[data-checker="${ id }"]` );
	const to = ( await page.locator( '[data-point="10"]' ).boundingBox() )!;
	await page.mouse.click( 2, 2 );
	await page.mouse.move( from.x + from.width / 2, from.y + from.height / 2 );
	await page.mouse.down();
	await page.mouse.move( to.x + to.width / 2, to.y + to.height / 2, { steps: 10 } );
	await page.mouse.up();

	await expect.poll( async () => ( await game( page ) ).player ).toBe( 'PLAYER_TWO' );
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
	await page.goto( '/game' );
	const boardGroup = page.getByRole( 'group', { name: 'Backgammon board' } );
	await expect( boardGroup ).toBeVisible();
	const board = await boardGroup.boundingBox();
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
	await page.getByRole( 'radio', { name: 'Local' } ).click();
	await page.getByRole( 'button', { name: 'Start game' } ).click();
	await page.waitForURL( '**/game' );
	await expect.poll( async () => ( await game( page ) ).phase ).toBe( 'moving' );
	const { player } = await game( page );
	// Every checker starts on the bar, so the first move is an entry.
	const before = JSON.stringify( ( await game( page ) ).checkers );
	await moveSomeChecker( page );
	await expect.poll( async () => JSON.stringify( ( await game( page ) ).checkers ) ).not.toBe( before );
	const after = await page.evaluate( () => ( window as any ).__backgammonStore.getState().game.state );
	expect( after.variant ).toBe( 'triktrak' );
	expect( after.waiting[ player! ] ).toBe( 14 );
} );

test( 'the computer answers with its own move', async ( { page } ) => {
	await page.goto( '/' );
	await page.waitForLoadState( 'networkidle' );
	await page.getByRole( 'radio', { name: /backgammon/i } ).click();
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
			await moveSomeChecker( page );
		}
		await page.waitForTimeout( 400 );
	}
	expect( await darkMoved() ).not.toBe( startDark );
} );
