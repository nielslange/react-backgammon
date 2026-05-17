/**
 * External dependencies
 */
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { handleClick } from '../helpers/handleClickHelper';
import { createNotice } from '../helpers/createNoticeHelper';
import { setNotice } from '../data/actions';
import { MessageType, NoticeStatusType, PlayerType, StateType } from '../types';

export const Checker = ( props: any ) => {
	const { className, id, player, count } = props;
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);
	const checkers = useSelector( ( state: StateType ) => state.checkers );
	const die = dice[ 0 ];

	const handleCheckerClick = ( event: any ) => {
		// If no player is selected yet, show message
		if ( currentPlayer === null ) {
			return dispatch(
				setNotice(
					createNotice(
						NoticeStatusType.ERROR,
						MessageType.ROLL_DICE_FIRST
					)
				)
			);
		}

		// Otherwise process the normal click
		handleClick( event, {
			id,
			player,
			dice,
			currentPlayer,
			checkers,
			die,
			dispatch,
		} );
	};

	return (
		<div
			key={ id }
			className={ className }
			title={ `Checker ${ id }` }
			data-checker={ id }
			data-player={ player }
			onClick={ handleCheckerClick }
		>
			{ count !== undefined && (
				<span className="checker-count">{ count }</span>
			) }
		</div>
	);
};
