'use client';

import { useState } from 'react';
import type { RoomView } from '../server/rooms';
import { Button } from './primitives/Button';

const VARIANT_NAME = {
	backgammon: 'Backgammon',
	triktrak: 'Triktrak',
} as const;

const REFUSALS: Record< string, string > = {
	ROOM_FULL: 'Someone else took the seat just now.',
	ROOM_NOT_FOUND: 'This room no longer exists.',
};

/** A friend's invitation: enter a name and take the free seat. */
export const JoinRoom = ( {
	room,
	onJoin,
}: {
	room: RoomView;
	onJoin: ( name: string ) => Promise< void >;
} ) => {
	const [ name, setName ] = useState( 'Dark' );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const points =
		room.matchTarget === 1 ? '1 point' : `${ room.matchTarget } points`;

	const submit = async ( event: React.FormEvent ) => {
		event.preventDefault();
		setBusy( true );
		setError( null );
		try {
			await onJoin( name.trim() || 'Dark' );
		} catch ( e ) {
			setError(
				REFUSALS[ ( e as { code?: string } ).code ?? '' ] ??
					'Joining did not work. Please try again.'
			);
			setBusy( false );
		}
	};

	return (
		<form
			onSubmit={ submit }
			className="mx-auto w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-raised"
		>
			<h1 className="mb-1 font-display text-2xl font-semibold">
				{ room.hostName } invites you to{ ' ' }
				{ VARIANT_NAME[ room.variant ] }
			</h1>
			<p className="mb-5 text-sm text-muted">
				Match to { points }. { room.hostName } plays Light, you play
				Dark.
			</p>
			<label
				htmlFor="join-name"
				className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
			>
				Your name
			</label>
			<input
				id="join-name"
				value={ name }
				maxLength={ 24 }
				onChange={ ( e ) => setName( e.target.value ) }
				className="mb-4 block min-h-11 w-full rounded-control border border-control bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-focus"
			/>
			{ error && (
				<p role="alert" className="mb-3 text-sm text-danger">
					{ error }
				</p>
			) }
			<Button
				type="submit"
				variant="primary"
				className="min-h-11 w-full"
				disabled={ busy }
			>
				{ busy ? 'Joining…' : 'Join game' }
			</Button>
		</form>
	);
};
