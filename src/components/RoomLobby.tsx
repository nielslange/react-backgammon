'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { RoomView } from '../server/rooms';
import { Button } from './primitives/Button';

/** The host waits here: the code and the link to send to a friend. */
export const RoomLobby = ( { room }: { room: RoomView } ) => {
	const [ copied, setCopied ] = useState( false );
	const link =
		typeof window === 'undefined'
			? `/room/${ room.code }`
			: `${ window.location.origin }/room/${ room.code }`;
	const copy = async () => {
		try {
			await navigator.clipboard.writeText( link );
			setCopied( true );
		} catch {
			setCopied( false );
		}
	};
	return (
		<section className="mx-auto w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-raised">
			<h1 className="mb-1 font-display text-2xl font-semibold">
				Your room
			</h1>
			<p className="mb-5 text-sm text-muted">
				Send the link or the code to the friend you want to play with.
			</p>
			<p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
				Room code
			</p>
			<p className="mb-4 font-mono text-4xl font-semibold tracking-[0.2em]">
				{ room.code }
			</p>
			<p className="mb-2 break-all rounded-control border border-line bg-canvas px-3 py-2 text-sm">
				{ link }
			</p>
			<div className="mb-5 flex flex-wrap gap-2">
				<Button
					variant="primary"
					className="min-h-11 sm:min-h-9"
					onClick={ copy }
				>
					{ copied ? 'Link copied' : 'Copy link' }
				</Button>
				<Link
					href="/"
					className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-medium hover:bg-canvas sm:min-h-9"
				>
					Cancel
				</Link>
			</div>
			<p role="status" className="text-sm text-muted">
				Waiting for your friend to join…
			</p>
		</section>
	);
};
