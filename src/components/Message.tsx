import { useSelector } from 'react-redux';

const Message = () => {
	const message = useSelector( ( state: any ) => state.message );

	return (
		<div>
			<h2>Message.tsx</h2>
			{ message }
		</div>
	);
};

export default Message;
