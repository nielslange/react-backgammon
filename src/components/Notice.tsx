import { useSelector } from 'react-redux';
import classnames from 'classnames';

const Notice = () => {
	const notice = useSelector( ( state: any ) => state.notice );

	console.log( notice );

	return (
		<>
			<h2>Notice.tsx</h2>
			<div className={ classnames( 'notice', notice.type ) }>
				{ notice.message }
			</div>
		</>
	);
};

export default Notice;
