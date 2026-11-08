import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { AppShell } from '../../components/AppShell';
import { makeStore } from '../../data/createStore';

let pathname = '/';
vi.mock( 'next/navigation', () => ( { usePathname: () => pathname } ) );

const renderShell = () => {
	const store = makeStore();
	render(
		<Provider store={ store }>
			<AppShell>
				<p>content</p>
			</AppShell>
		</Provider>
	);
	return store;
};

describe( 'AppShell', () => {
	beforeEach( () => {
		document.documentElement.removeAttribute( 'data-theme' );
		try {
			localStorage.clear();
		} catch {
			// storage unavailable in this environment
		}
	} );

	it( 'offers a new game in the header during a game, not on the start screen', () => {
		pathname = '/game';
		renderShell();
		expect( screen.getByRole( 'link', { name: 'New game' } ) ).toHaveAttribute( 'href', '/' );
	} );

	it( 'has no new-game link on the start screen', () => {
		pathname = '/';
		renderShell();
		expect( screen.queryByRole( 'link', { name: 'New game' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders a header with a home link and the page content', () => {
		renderShell();
		expect( screen.getByRole( 'banner' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /backgammon/i } ) ).toHaveAttribute( 'href', '/' );
		expect( screen.getByRole( 'main' ) ).toHaveTextContent( 'content' );
	} );

	it( 'cycles the theme system → light → dark → system and sets data-theme', async () => {
		const store = renderShell();
		const toggle = screen.getByRole( 'button', { name: /theme/i } );
		expect( document.documentElement ).not.toHaveAttribute( 'data-theme' );
		await userEvent.click( toggle );
		expect( store.getState().ui.theme ).toBe( 'light' );
		expect( document.documentElement ).toHaveAttribute( 'data-theme', 'light' );
		await userEvent.click( toggle );
		expect( document.documentElement ).toHaveAttribute( 'data-theme', 'dark' );
		await userEvent.click( toggle );
		expect( store.getState().ui.theme ).toBe( 'system' );
		expect( document.documentElement ).not.toHaveAttribute( 'data-theme' );
	} );
} );
