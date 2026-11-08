'use client';

import { useSelector } from 'react-redux';
import { selectLegalSteps } from '../data/selectors';
import type { RootState } from '../data/store';
import { OFF } from '../engine/constants';
import type { Checker, Step } from '../engine/types';
import { BoardSvg } from './board/BoardSvg';
import { useBoardInteraction } from './board/useBoardInteraction';

const describeTarget = ( step: Step, player: Checker[ 'player' ] ) =>
	step.to === OFF[ player ]
		? `Bear off with the ${ step.die }`
		: `Move to point ${ step.to } with the ${ step.die }`;

/** The top checker of every stack that has a legal step. */
const movableIds = ( checkers: Checker[], steps: Step[] ): number[] => [ ...new Set( steps.map( ( s ) => s.checkerId ) ) ].filter( ( id ) => checkers.some( ( c ) => c.id === id ) );

/** The board connected to the store: click, drag or keyboard to move. */
export const Board = () => {
	const checkers = useSelector( ( root: RootState ) => root.game.state.checkers );
	const preview = useSelector( ( root: RootState ) => root.ui.preview );
	const interaction = useBoardInteraction();
	const player = useSelector( ( root: RootState ) => root.game.state.player );
	const steps = useSelector( selectLegalSteps );
	const highlights = preview ? [ ...new Set( preview.options.map( ( o ) => o.to ) ) ] : [];
	const targetLabels: Record< number, string > = {};
	if ( preview && player ) {
		for ( const option of [ ...preview.options ].sort( ( a, b ) => b.die - a.die ) ) {
			targetLabels[ option.to ] = describeTarget( option, player );
		}
	}

	return (
		<BoardSvg
			svgRef={ interaction.svgRef }
			checkers={ checkers }
			highlights={ highlights }
			selected={ preview?.checkerId ?? null }
			drag={ interaction.drag }
			movable={ movableIds( checkers, steps ) }
			targetLabels={ targetLabels }
			onCheckerPointerDown={ interaction.onCheckerPointerDown }
			onCheckerClick={ interaction.onCheckerClick }
			onLaneClick={ interaction.onLaneClick }
		/>
	);
};
