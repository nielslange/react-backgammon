/**
 * External dependencies
 */
import classnames from 'classnames';
import { useSelector } from 'react-redux';

export const Notice = () => {
	const notice = useSelector( ( state: any ) => state.notice );

	return (
		<>
			<h2>Notice.tsx</h2>
			<div className={ classnames( 'notice', notice.status ) }>
				{ notice.message }
			</div>
		</>
	);
};
