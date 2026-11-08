'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

type Props = {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
};

const FOCUSABLE =
	'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog: focus moves in on open and returns on close, Escape
 * closes, Tab stays inside.
 */
export const Dialog = ( { open, title, onClose, children }: Props ) => {
	const titleId = useId();
	const ref = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( ! open ) return;
		const previous = document.activeElement as HTMLElement | null;
		const node = ref.current;
		const first = node?.querySelector< HTMLElement >( FOCUSABLE );
		( first ?? node )?.focus();

		const onKey = ( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				onClose();
				return;
			}
			if ( event.key !== 'Tab' || ! node ) return;
			const items = Array.from( node.querySelectorAll< HTMLElement >( FOCUSABLE ) );
			if ( items.length === 0 ) return;
			const firstItem = items[ 0 ];
			const lastItem = items[ items.length - 1 ];
			if ( event.shiftKey && document.activeElement === firstItem ) {
				event.preventDefault();
				lastItem.focus();
			} else if ( ! event.shiftKey && document.activeElement === lastItem ) {
				event.preventDefault();
				firstItem.focus();
			}
		};
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.removeEventListener( 'keydown', onKey );
			previous?.focus?.();
		};
	}, [ open, onClose ] );

	if ( ! open ) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
			<div
				ref={ ref }
				role="dialog"
				aria-modal="true"
				aria-labelledby={ titleId }
				tabIndex={ -1 }
				className="w-full max-w-sm rounded-card border border-line bg-surface p-6 text-ink shadow-board"
			>
				<h2 id={ titleId } className="mb-3 font-display text-xl font-semibold">
					{ title }
				</h2>
				{ children }
			</div>
		</div>
	);
};
