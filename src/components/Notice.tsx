/**
 * External dependencies
 */
import { useSelector } from 'react-redux';
import { clsx } from 'clsx';

/**
 * Internal dependencies
 */
import { StateType } from '../types';

export const Notice = () => {
	const notice = useSelector( ( state: StateType ) => state.notice );

	return (
		<>
			<h2>Notice.tsx</h2>

			<div
				key={ notice.status }
				className={ clsx( 'notice', notice.status ) }
			>
				{ notice.message }
			</div>
		</>
	);
};
