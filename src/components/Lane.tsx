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
		const filteredCheckers = checkers.filter(
			( item: any ) =>
				item.lane === lane &&
				( keySuffix ? item.player === player : true )
		);
		const checkerElements = filteredCheckers.map( ( item: any ) => (
			<Checker
				className="checker"
				currentPlayer={ currentPlayer }
				id={ item.id }
				key={ item.id }
				player={ item.player }
			/>
		) );
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
