import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { DiceTray } from '../../components/DiceTray';
import { Toast } from '../../components/Toast';
import { makeStore } from '../../data/createStore';
import { newGame } from '../../data/gameSlice';
import { setHint } from '../../data/uiSlice';
import { MessageType, NoticeStatusType } from '../../types';

/**
 * On phones the notice and the dice status lie on the dark felt. Tinted or
 * muted text needs its own opaque surface there to stay readable.
 */
describe( 'text on the board', () => {
	it( 'puts every notice on an opaque surface, whatever its tint', () => {
		const store = makeStore();
		store.dispatch( setHint( { message: MessageType.MOVE_CHECKER, status: NoticeStatusType.SUCCESS } ) );
		render(
			<Provider store={ store }>
				<Toast />
			</Provider>
		);
		const box = screen.getByText( MessageType.MOVE_CHECKER );
		expect( box.closest( '.bg-surface' ) ).not.toBeNull();
	} );

	it( 'shows the dice status as a readable label when the dice lie on the board', () => {
		const store = makeStore();
		store.dispatch( newGame( { variant: 'backgammon' } ) );
		render(
			<Provider store={ store }>
				<DiceTray onBoard />
			</Provider>
		);
		const status = screen.getByText( /opening roll/i );
		expect( status ).toHaveClass( 'bg-surface' );
		expect( status ).toHaveClass( 'text-ink' );
	} );
} );
