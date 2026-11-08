import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Game } from '../../components/Game';
import { makeStore } from '../../data/createStore';
import { loadSnapshot, newGame } from '../../data/gameSlice';
import { P1 } from '../engine/fixtures';

vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push: () => {} } ), usePathname: () => '/game' } ) );

const mediaMatches = ( matches: boolean ) =>
	vi.stubGlobal( 'matchMedia', ( query: string ) => ( {
		matches,
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	} ) );

const renderGame = () => {
	const store = makeStore();
	store.dispatch( newGame( { variant: 'backgammon' } ) );
	store.dispatch(
		loadSnapshot( {
			snapshot: { ...store.getState().game.state, phase: 'moving', player: P1, firstMover: P1, roll: [ 5, 3 ], dice: [ 5, 3 ] },
		} )
	);
	return render(
		<Provider store={ store }>
			<Game />
		</Provider>
	);
};

describe( 'the game on a phone in portrait', () => {
	afterEach( () => vi.unstubAllGlobals() );

	it( 'puts the dice and the notice on the board and slims the player cards', () => {
		mediaMatches( true );
		const { container } = renderGame();
		const box = container.querySelector( '[data-layout="phone"] [data-board-box]' );
		expect( box ).not.toBeNull();
		expect( box!.querySelector( 'svg[aria-label="Backgammon board"]' ) ).not.toBeNull();
		expect( box!.querySelector( '.dice-tray' ) ).not.toBeNull();
		expect( box!.querySelector( '[role="status"]' ) ).not.toBeNull();
		expect( container.querySelectorAll( 'section[data-compact]' ) ).toHaveLength( 2 );
		// The dice sit in the half of the player to move: Light plays on the right.
		expect( box!.querySelector( '[data-dice-overlay]' ) ).toHaveAttribute( 'data-side', 'right' );
	} );

	it( 'keeps the side panel layout on larger screens', () => {
		mediaMatches( false );
		const { container } = renderGame();
		expect( container.querySelector( '[data-layout="phone"]' ) ).toBeNull();
		expect( container.querySelector( '[data-board-box] .dice-tray' ) ).toBeNull();
		expect( container.querySelector( '.dice-tray' ) ).not.toBeNull();
		expect( container.querySelectorAll( 'section[data-compact]' ) ).toHaveLength( 0 );
	} );
} );

describe( 'the game on a phone held sideways', () => {
	afterEach( () => vi.unstubAllGlobals() );

	it( 'puts the board beside a column with the players, dice and actions', () => {
		vi.stubGlobal( 'matchMedia', ( query: string ) => ( {
			matches: query.includes( 'landscape' ),
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
		} ) );
		const { container } = renderGame();
		const layout = container.querySelector( '[data-layout="phone-landscape"]' );
		expect( layout ).not.toBeNull();
		const side = layout!.querySelector( '[data-side-column]' )!;
		expect( side.querySelector( '.dice-tray' ) ).not.toBeNull();
		expect( side.querySelectorAll( 'section[data-compact]' ) ).toHaveLength( 2 );
		expect( layout!.querySelector( '[data-board-box] svg' ) ).not.toBeNull();
	} );
} );

describe( 'before the screen shape is known (server render)', () => {
	it( 'renders no layout instead of guessing one', async () => {
		const { renderToString } = await import( 'react-dom/server' );
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		const html = renderToString(
			<Provider store={ store }>
				<Game />
			</Provider>
		);
		expect( html ).toContain( 'data-layout="pending"' );
		expect( html ).not.toContain( 'Backgammon board' );
	} );
} );
