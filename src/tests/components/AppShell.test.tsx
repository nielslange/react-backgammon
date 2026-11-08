import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { AppShell } from '../../components/AppShell';
import { makeStore } from '../../data/createStore';

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
