'use client';

import { useMemo } from 'react';
import { useSelector, useStore } from 'react-redux';
import { selectLegalSteps } from '../data/selectors';
import type { RootState } from '../data/store';
import { OFF } from '../engine/constants';
import type { Checker, Step } from '../engine/types';
import { makeGeometry } from '../ui/boardGeometry';
import { BoardSvg } from './board/BoardSvg';
import { useBoardInteraction } from './board/useBoardInteraction';

const describeTarget = ( step: Step, player: Checker[ 'player' ] ) =>
	step.to === OFF[ player ]
		? `Bear off with the ${ step.die }`
		: `Move to point ${ step.to } with the ${ step.die }`;

/** The top checker of every stack that has a legal step. */
const movableIds = ( checkers: Checker[], steps: Step[] ): number[] =>
	[ ...new Set( steps.map( ( s ) => s.checkerId ) ) ].filter( ( id ) =>
		checkers.some( ( c ) => c.id === id )
	);

/** The checker drawn on top of a player's stack on a lane (the last by id). */
const topChecker = (
	checkers: Checker[],
	player: Checker[ 'player' ],
	lane: number
): number | null => {
	const ids = checkers
		.filter( ( c ) => c.player === player && c.lane === lane )
		.map( ( c ) => c.id );
	return ids.length ? Math.max( ...ids ) : null;
};

/** The board connected to the store: tap, drag or keyboard to move. */
export const Board = ( {
	height,
	className,
}: {
	height?: number;
	className?: string;
} ) => {
	const store = useStore< RootState >();
	const checkers = useSelector(
		( root: RootState ) => root.game.state.checkers
	);
	const preview = useSelector( ( root: RootState ) => root.ui.preview );
	const geometry = useMemo( () => makeGeometry( height ), [ height ] );
	const interaction = useBoardInteraction( geometry );
	const player = useSelector( ( root: RootState ) => root.game.state.player );
	const steps = useSelector( selectLegalSteps );
	const highlights = preview
		? [ ...new Set( preview.options.map( ( o ) => o.to ) ) ]
		: [];
	const targetLabels: Record< number, string > = {};
	if ( preview && player ) {
		for ( const option of [ ...preview.options ].sort(
			( a, b ) => b.die - a.die
		) ) {
			targetLabels[ option.to ] = describeTarget( option, player );
		}
	}

	// A tap anywhere in a column: land there if it is highlighted, otherwise
	// pick the top checker of the player to move on that point.
	const onColumnClick = ( lane: number ) => {
		if ( highlights.includes( lane ) ) {
			interaction.onLaneClick( lane );
			return;
		}
		const game = store.getState().game.state;
		const id = game.player
			? topChecker( game.checkers, game.player, lane )
			: null;
		if ( id !== null ) interaction.onCheckerClick( id );
	};

	// Like on a real board, a stack is taken from the top: whichever of its
	// checkers is clicked or grabbed, the top one moves and the rest stay.
	const topOf = ( id: number ) => {
		const checker = checkers.find( ( c ) => c.id === id );
		return checker
			? ( topChecker( checkers, checker.player, checker.lane ) ?? id )
			: id;
	};

	return (
		<BoardSvg
			height={ height }
			className={ className }
			onColumnClick={ onColumnClick }
			svgRef={ interaction.svgRef }
			checkers={ checkers }
			highlights={ highlights }
			selected={ preview?.checkerId ?? null }
			drag={ interaction.drag }
			movable={ movableIds( checkers, steps ) }
			targetLabels={ targetLabels }
			onCheckerPointerDown={ ( id, event ) =>
				interaction.onCheckerPointerDown( topOf( id ), event )
			}
			onCheckerClick={ ( id ) =>
				interaction.onCheckerClick( topOf( id ) )
			}
			onLaneClick={ interaction.onLaneClick }
		/>
	);
};
