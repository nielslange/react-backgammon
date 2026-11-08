'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '../data/store';
import { BoardSvg } from './board/BoardSvg';
import { useBoardInteraction } from './board/useBoardInteraction';

/** The board connected to the store: click or drag to move. */
export const Board = () => {
	const checkers = useSelector( ( root: RootState ) => root.game.state.checkers );
	const preview = useSelector( ( root: RootState ) => root.ui.preview );
	const interaction = useBoardInteraction();
	const highlights = preview ? [ ...new Set( preview.options.map( ( o ) => o.to ) ) ] : [];

	return (
		<BoardSvg
			svgRef={ interaction.svgRef }
			checkers={ checkers }
			highlights={ highlights }
			selected={ preview?.checkerId ?? null }
			drag={ interaction.drag }
			onCheckerPointerDown={ interaction.onCheckerPointerDown }
			onCheckerClick={ interaction.onCheckerClick }
			onLaneClick={ interaction.onLaneClick }
		/>
	);
};
