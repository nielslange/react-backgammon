'use client';

/**
 * External dependencies
 */
import { useSelector } from 'react-redux';
import { clsx } from 'clsx';

/**
 * Internal dependencies
 */
import { selectNotice } from '../data/selectors';
import { NoticeStatusType } from '../types';

const STATUS_CLASSES: Record< NoticeStatusType, string > = {
	[ NoticeStatusType.ERROR ]: 'border-danger/40 bg-danger/10',
	[ NoticeStatusType.SUCCESS ]: 'border-success/40 bg-success/10',
	[ NoticeStatusType.INFO ]: 'border-line bg-canvas',
};

export const Notice = () => {
	const notice = useSelector( selectNotice );

	return (
		<>
			<h2 className="h6">Notice.tsx</h2>

			<div
				role="status"
				aria-live="polite"
				className={ clsx(
					'alert rounded-control border px-4 py-3 text-sm',
					STATUS_CLASSES[ notice.status ]
				) }
			>
				{ notice.message }
			</div>
		</>
	);
};
