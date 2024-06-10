/**
 * External dependencies
 */
import { useSelector } from 'react-redux';
import Alert from 'react-bootstrap/Alert';

export const Notice = () => {
	const notice = useSelector( ( state: any ) => state.notice );

	return (
		<>
			<h2 className="h4">Notice.tsx</h2>

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
