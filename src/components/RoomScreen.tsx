'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from 'react-redux';
import type { AppStore } from '../data/createStore';
import { appRoomDeps } from '../net/appRoom';
import { useRoom, type RoomDeps } from '../net/useRoom';
import { Game } from './Game';
import { JoinRoom } from './JoinRoom';
import { RoomLobby } from './RoomLobby';

const Message = ( {
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
} ) => (
	<section className="mx-auto w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-raised">
		<h1 className="mb-2 font-display text-2xl font-semibold">{ title }</h1>
		<div className="text-sm text-muted">{ children }</div>
		<Link
			href="/"
			className="mt-4 inline-flex min-h-11 items-center rounded-control bg-accent px-4 font-medium text-accent-ink sm:min-h-10"
		>
			Back to the start
		</Link>
	</section>
);

/** /room/CODE: the lobby, the invitation, or the online game itself. */
export const RoomScreen = ( {
	code,
	deps,
}: {
	code: string;
	deps?: RoomDeps;
} ) => {
	const store = useStore() as AppStore;
	// The app's real backend, created once; tests pass their own.
	const [ resolved ] = useState< RoomDeps >(
		() => deps ?? appRoomDeps( store )
	);
	const { state, join } = useRoom( code, resolved );
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
				<Message title="Could not open the room">
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
