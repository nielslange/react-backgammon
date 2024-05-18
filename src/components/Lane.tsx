/**
 * External dependencies
 */
import { useSelector } from 'react-redux';
import { Checker } from './Checker';

/**
 * Internal dependencies
 */
import type { LaneType, StateType } from '../types';

export const Lane = ( { from, to, player }: LaneType ): JSX.Element => {
	const checkers = useSelector( ( state: any ) => state.checkers );
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);
	const lanes = [];

	if ( from < to ) {
		for ( let i = from; i <= to; i++ ) {
			const checker: JSX.Element[] = checkers
				.filter( ( item: any ) => item.lane === i )
				.map( ( item: any ) => (
					<Checker
						key={ item.id }
						className="checker"
						id={ item.id }
						player={ item.player }
						currentPlayer={ currentPlayer }
					/>
				) );
			lanes.push(
				<div
					className="lane"
					title={ i.toString() }
					data-lane={ i }
					key={ i }
				>
					{ checker }
				</div>
			);
		}
	} else if ( from > to ) {
		for ( let i = from; i >= to; i-- ) {
			const checker: JSX.Element[] = checkers
				.filter( ( item: any ) => item.lane === i )
				.map( ( item: any ) => (
					<Checker
						key={ item.id }
						className="checker"
						id={ item.id }
						player={ item.player }
						currentPlayer={ currentPlayer }
					/>
				) );
			lanes.push(
				<div className="lane" data-lane={ i } key={ i }>
					{ checker }
				</div>
			);
		}
	} else {
		const key = `${ player }-${ from }`;
		const checker: JSX.Element[] = checkers
			.filter( ( item: any ) => item.lane === from )
			.filter( ( item: any ) => item.player === player )
			.map( ( item: any ) => (
				<Checker
					key={ item.id }
					className="checker"
					id={ item.id }
					player={ item.player }
					currentPlayer={ currentPlayer }
				/>
			) );
		lanes.push(
			<div className="lane" data-lane={ from } key={ key }>
				{ checker }
			</div>
		);
	}
	return <>{ lanes }</>;
};
