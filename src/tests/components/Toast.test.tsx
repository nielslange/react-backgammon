import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Toast } from '../../components/Toast';
import { makeStore } from '../../data/createStore';
import { setHint } from '../../data/uiSlice';
import { MessageType, NoticeStatusType } from '../../types';

describe( 'Toast', () => {
	beforeEach( () => vi.useFakeTimers() );
	afterEach( () => vi.useRealTimers() );

	const renderToast = () => {
		const store = makeStore();
		render(
			<Provider store={ store }>
				<Toast />
			</Provider>
		);
		return store;
	};

	it( 'hides an info notice after three seconds', () => {
		const store = renderToast();
		act( () => {
			store.dispatch( setHint( { message: MessageType.PREVIEW_MOVE, status: NoticeStatusType.INFO } ) );
		} );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( MessageType.PREVIEW_MOVE );
		act( () => {
			vi.advanceTimersByTime( 3000 );
		} );
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );

	it( 'keeps an error until the next notice', () => {
		const store = renderToast();
		act( () => {
			store.dispatch( setHint( { message: MessageType.WAITING_CHECKER, status: NoticeStatusType.ERROR } ) );
			vi.advanceTimersByTime( 10000 );
		} );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( MessageType.WAITING_CHECKER );
	} );

	it( 'shows a new notice again after an earlier one was hidden', () => {
		const store = renderToast();
		act( () => {
			store.dispatch( setHint( { message: MessageType.PREVIEW_MOVE, status: NoticeStatusType.INFO } ) );
			vi.advanceTimersByTime( 3000 );
			store.dispatch( setHint( { message: MessageType.SELECT_DIE_FIRST, status: NoticeStatusType.INFO } ) );
		} );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( MessageType.SELECT_DIE_FIRST );
	} );
} );
