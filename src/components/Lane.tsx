/**
 * External dependencies
 */
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { Checker } from './Checker';

/**
 * Internal dependencies
 */
import type { LaneType, StateType } from '../types';

export const Lane = ( {
	from,
	to,
	player,
	bar,
	off,
}: LaneType ): JSX.Element => {
	const checkers = useSelector( ( state: StateType ) => state.checkers );
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);
	const lanes = [];

	const renderChecker = ( lane: number, keySuffix: string = '' ) => {
		const laneOwner = bar ? player : off ? off : undefined;
		const filteredCheckers = checkers.filter( ( item: any ) => {
			if ( item.lane !== lane ) return false;
			// Bar (lanes 0/25) and off (lanes 0/25) overlap — filter by owner
			// so a P1 checker on the bar (lane 0) isn't rendered in the P2 off
			// zone (also lane 0), and vice-versa.
			if ( laneOwner ) return item.player === laneOwner;
			if ( keySuffix ) return item.player === player;
			return true;
		} );
		const isStackedLane = ! bar && ! off;
		const maxVisible = 5;
		const visibleCheckers =
			isStackedLane && filteredCheckers.length > maxVisible
				? filteredCheckers.slice( 0, maxVisible )
				: filteredCheckers;
		// Lanes 1–12 sit on the bottom half (justify-content: flex-end), so
		// the innermost (toward board center) checker is index 0. Lanes 13–24
		// sit on the top half (flex-start), where the innermost is the last.
		const isBottomLane = lane >= 1 && lane <= 12;
		const overflowIndex = isBottomLane ? 0 : maxVisible - 1;
		const checkerElements = visibleCheckers.map(
			( item: any, index: number ) => (
				<Checker
					className="checker"
					currentPlayer={ currentPlayer }
					id={ item.id }
					key={ item.id }
					player={ item.player }
					count={
						isStackedLane &&
						filteredCheckers.length > maxVisible &&
						index === overflowIndex
							? filteredCheckers.length
							: undefined
					}
				/>
			)
		);
		const key = keySuffix ? `${ player }-${ lane }` : lane.toString();
		return (
			<div
				className={ clsx( 'lane', bar && 'bar', off && 'off' ) }
				data-lane={ lane }
				data-bar={ bar }
				data-off={ off }
				key={ key }
			>
				{ checkerElements }
			</div>
		);
	};

	// Render checker that are moving from one lane to another (if-state)
	// or render checker that are staying in the same lane (else-state)
	if ( from !== to ) {
		const range =
			from < to
				? Array.from( { length: to - from + 1 }, ( _, i ) => from + i )
				: Array.from( { length: from - to + 1 }, ( _, i ) => from - i );
		lanes.push( ...range.map( ( lane ) => renderChecker( lane ) ) );
	} else {
		lanes.push( renderChecker( from, `${ player }` ) );
	}

	return <>{ lanes }</>;
};
