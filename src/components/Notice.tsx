/**
 * External dependencies
 */
import { useSelector } from 'react-redux';
import Alert from 'react-bootstrap/Alert';

/**
 * Internal dependencies
 */
import { selectNotice } from '../data/selectors';

export const Notice = () => {
	const notice = useSelector( selectNotice );

	return (
		<>
			<h2 className="h6">Notice.tsx</h2>

			<Alert key={ notice.status } variant={ notice.status } transition={ true }>
				{ notice.message }
			</Alert>
		</>
	);
};
