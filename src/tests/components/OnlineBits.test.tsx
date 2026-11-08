import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { GameOverDialog } from '../../components/GameOverDialog';
import { PlayerCard } from '../../components/PlayerCard';
import { makeStore } from '../../data/createStore';
import { loadSnapshot, newGame } from '../../data/gameSlice';
import { joinedRoom, opponentPresence } from '../../data/netSlice';
import { configureSession } from '../../data/sessionSlice';
import { P1, P2 } from '../engine/fixtures';

vi.mock( 'next/navigation', () => ( { useRouter: () => ( { push: () => {} } ) } ) );

const onlineStore = () => {
	const store = makeStore();
	store.dispatch(
		configureSession( {
			players: { [ P1 ]: { kind: 'human', name: 'Niels' }, [ P2 ]: { kind: 'remote', name: 'Anna' } },
			matchTarget: 3,
		} )
	);
	store.dispatch( newGame( { variant: 'backgammon' } ) );
	store.dispatch( joinedRoom( { roomCode: 'K7QM2X', roomId: 'r', gameId: 'g', role: 'host', seat: P1, status: 'playing', version: 1 } ) );
	return store;
};

describe( 'online details', () => {
	it( 'shows whether the remote player is online, in words', () => {
		const store = onlineStore();
		const { rerender } = render(
			<Provider store={ store }>
				<PlayerCard player={ P2 } />
				<PlayerCard player={ P1 } />
			</Provider>
		);
		expect( screen.getByText( 'offline' ) ).toBeInTheDocument();
		store.dispatch( opponentPresence( true ) );
		rerender(
			<Provider store={ store }>
				<PlayerCard player={ P2 } />
				<PlayerCard player={ P1 } />
			</Provider>
		);
		expect( screen.getByText( 'online' ) ).toBeInTheDocument();
		// Only the remote seat has a presence label.
		expect( screen.getAllByText( /^(online|offline)$/ ) ).toHaveLength( 1 );
	} );

	it( 'does not start a local next game at the end of an online game', () => {
		const store = onlineStore();
		store.dispatch(
			loadSnapshot( {
				snapshot: { ...store.getState().game.state, phase: 'over', player: null, result: { winner: P1, kind: 'single', points: 1 } },
			} )
		);
		render(
			<Provider store={ store }>
				<GameOverDialog />
			</Provider>
		);
		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		// Only the server-backed button: no local game, no local new match.
		expect( screen.getAllByRole( 'button', { name: 'Next game' } ) ).toHaveLength( 1 );
		expect( screen.queryByRole( 'button', { name: 'New match' } ) ).toBeNull();
	} );
} );
