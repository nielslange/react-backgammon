'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectNotice } from '../data/selectors';
import type { NoticeType } from '../types/NoticeType';
import { NoticeStatusType } from '../types/NoticeStatusType';

const STATUS_CLASSES: Record< NoticeStatusType, string > = {
	[ NoticeStatusType.ERROR ]: 'border-danger/40 bg-danger/10',
	[ NoticeStatusType.SUCCESS ]: 'border-success/40 bg-success/10',
	[ NoticeStatusType.INFO ]: 'border-line bg-canvas',
};

const INFO_TIMEOUT = 3000;

/**
 * The current notice. Info notices fade after three seconds; errors and
 * results stay until the next notice replaces them.
 */
export const Toast = ( { className }: { className?: string } ) => {
	const notice = useSelector( selectNotice );
	const [ hidden, setHidden ] = useState< NoticeType | null >( null );

	useEffect( () => {
		if ( notice.status !== NoticeStatusType.INFO ) return;
		const timer = setTimeout( () => setHidden( notice ), INFO_TIMEOUT );
		return () => clearTimeout( timer );
	}, [ notice ] );

	const visible = hidden !== notice;

	return (
		<div
			role="status"
			aria-live="polite"
			className={ clsx( 'min-h-10', className ) }
		>
			{ visible && (
				// The tints are translucent: an opaque surface keeps the text
				// readable where the notice lies on the board (phones).
				<div className="rounded-control bg-surface">
					<div
						className={ clsx(
							'rounded-control border px-3 py-2 text-sm transition-opacity',
							STATUS_CLASSES[ notice.status ]
						) }
					>
						{ notice.message }
					</div>
				</div>
			) }
		</div>
	);
};
