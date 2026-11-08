/**
 * External dependencies
 */
import { clsx } from 'clsx';
import { useDispatch, useSelector, useStore } from 'react-redux';

/**
 * Internal dependencies
 */
import type { AppDispatch, RootState } from '../data/store';
import type { Player } from '../engine/types';
import { onCheckerClick } from '../ui/moveInput';

type Props = {
	className?: string;
	id: number;
	player: Player;
	count?: number;
};

export const Checker = ( { className, id, player, count }: Props ) => {
	const dispatch = useDispatch< AppDispatch >();
	const store = useStore< RootState >();
	const isSelected = useSelector(
		( root: RootState ) => root.ui.preview?.checkerId === id
	);

	const handleCheckerClick = ( event: React.MouseEvent ) => {
		// The lane underneath confirms a preview on click; a checker click
		// must not double as a lane click.
		event.stopPropagation();
		onCheckerClick( dispatch, store.getState(), id );
	};

	return (
		<div
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
