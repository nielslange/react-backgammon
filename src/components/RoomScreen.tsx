'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from 'react-redux';
import type { AppStore } from '../data/createStore';
import { appRoomDeps } from '../net/appRoom';
import { onlineConfigured } from '../net/config';
import { useRoom, type RoomDeps } from '../net/useRoom';
import { Game } from './Game';
import { JoinRoom } from './JoinRoom';
import { RoomLobby } from './RoomLobby';
import { Button } from './primitives/Button';

const Message = ( {
	title,
	children,
	onRetry,
}: {
	title: string;
	children: React.ReactNode;
	onRetry?: () => void;
} ) => (
	<section className="mx-auto w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-raised">
		<h1 className="mb-2 font-display text-2xl font-semibold">{ title }</h1>
		<div className="text-sm text-muted">{ children }</div>
		{ onRetry && (
			<Button
				variant="primary"
				className="mr-2 mt-4 min-h-11 sm:min-h-10"
				onClick={ onRetry }
			>
				Try again
			</Button>
		) }
		<Link
			href="/"
			className="mt-4 inline-flex min-h-11 items-center rounded-control bg-accent px-4 font-medium text-accent-ink sm:min-h-10"
		>
			Back to the start
		</Link>
	</section>
);

/** /room/CODE: the lobby, the invitation, or the online game itself. */
export const RoomScreen = ( props: { code: string; deps?: RoomDeps } ) =>
	// A build without Supabase keys explains itself instead of failing.
	props.deps || onlineConfigured() ? (
		<ConnectedRoom { ...props } />
	) : (
		<Message title="Online play is not available yet">
			This site is not connected to its game server yet. You can still
			play on one screen or against the computer.
		</Message>
	);

const ConnectedRoom = ( { code, deps }: { code: string; deps?: RoomDeps } ) => {
	const store = useStore() as AppStore;
	// The app's real backend, created once; tests pass their own.
	const [ resolved ] = useState< RoomDeps >(
		() => deps ?? appRoomDeps( store )
	);
	const { state, join, retry } = useRoom( code, resolved );
	const shown = code.toUpperCase();

	switch ( state.kind ) {
		case 'loading':
			return (
				<p role="status" className="mx-auto text-sm text-muted">
					Opening room { shown }…
				</p>
			);
		case 'not-found':
			return (
				<Message title="Room not found">
					There is no room with the code { shown }. Check the code or
					start a new game.
				</Message>
			);
		case 'full':
			return (
				<Message title="This room is full">
					Two players are already playing in room { shown }.
				</Message>
			);
		case 'error':
			return (
				<Message title="Could not open the room" onRetry={ retry }>
					Please check your connection and try again ({ state.code }).
				</Message>
			);
		case 'lobby':
			return <RoomLobby room={ state.room } />;
		case 'join':
			return <JoinRoom room={ state.room } onJoin={ join } />;
		case 'playing':
			return <Game />;
	}
};
