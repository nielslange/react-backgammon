/**
 * External dependencies
 */
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { handleClick } from '../helpers/handleClickHelper';
import type { PlayerType, StateType } from '../types';

export const Checker = ( props: any ) => {
	const { className, id, player } = props;
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const currentPlayer: PlayerType = useSelector(
		( state: StateType ) => state.currentPlayer
	);
	const checkers = useSelector( ( state: StateType ) => state.checkers );
	const die = dice[ 0 ];

	return (
		<div
			key={ id }
			className={ className }
			data-checker={ id }
			data-player={ player }
			onClick={ ( event ) =>
				handleClick( event, {
					id,
					player,
					dice,
					currentPlayer,
					checkers,
					die,
					dispatch,
				} )
			}
		>
			{ id }
		</div>
	);
};
