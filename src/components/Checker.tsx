/**
 * External dependencies
 */
import { clsx } from 'clsx';
import { useDispatch, useSelector, useStore } from 'react-redux';

/**
 * Internal dependencies
 */
import { handleCheckerSelection } from '../helpers/moveSelectionHelper';
import { StateType } from '../types';

export const Checker = ( props: any ) => {
	const { className, id, player, count } = props;
	const dispatch = useDispatch();
	const store = useStore< StateType >();
	const isSelected = useSelector(
		( state: StateType ) => state.preview?.checkerId === id
	);

	const handleCheckerClick = ( event: React.MouseEvent ) => {
		// The lane underneath confirms a preview on click; a checker click
		// must not double as a lane click.
		event.stopPropagation();
		handleCheckerSelection( dispatch, store.getState(), { id, player } );
	};

	return (
		<div
			key={ id }
			className={ clsx( className, isSelected && 'checker--selected' ) }
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
