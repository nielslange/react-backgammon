'use client';

import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '../data/store';
import { onCheckerClick, onTargetClick } from '../ui/moveInput';
import { BoardSvg } from './board/BoardSvg';

/** The board connected to the store: clicks go through moveInput. */
export const Board = () => {
	const dispatch = useDispatch< AppDispatch >();
	const store = useStore< RootState >();
	const checkers = useSelector( ( root: RootState ) => root.game.state.checkers );
	const preview = useSelector( ( root: RootState ) => root.ui.preview );
	const highlights = preview ? [ ...new Set( preview.options.map( ( o ) => o.to ) ) ] : [];

	return (
		<BoardSvg
			checkers={ checkers }
			highlights={ highlights }
			selected={ preview?.checkerId ?? null }
			onCheckerClick={ ( id ) => onCheckerClick( dispatch, store.getState(), id ) }
			onLaneClick={ ( lane ) => onTargetClick( dispatch, store.getState(), lane ) }
		/>
	);
};
