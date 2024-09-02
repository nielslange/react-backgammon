/**
 * External dependencies
 */
import { useSelector } from 'react-redux';
import Alert from 'react-bootstrap/Alert';

/**
 * Internal dependencies
 */
import { StateType } from '../types';

export const Notice = () => {
	const notice = useSelector( ( state: StateType ) => state.notice );

	return (
		<>
			<h2 className="h6">Notice.tsx</h2>

			<Alert
				key={ notice.status }
				variant={ notice.status }
				transition={ true }
			>
				{ notice.message }
			</Alert>
		</>
	);
};
