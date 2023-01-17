import { useSelector } from 'react-redux';
import Checker from './Checker';
interface LanesProps {
	from: number;
	to: number;
}

const Lane = ( { from, to }: LanesProps ): JSX.Element => {
	const checkers = useSelector( ( state: any ) => state.checkers );
	const currentPlayer = useSelector( ( state: any ) => state.currentPlayer );
	const lanes = [];
	if ( from < to ) {
		for ( let i = from; i <= to; i++ ) {
			const checker: JSX.Element[] = checkers
				.filter( ( item: any ) => item.row === i )
				.map( ( item: any ) => (
					<Checker
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
		for ( let i = from; i >= to; i-- ) {
			const checker: JSX.Element[] = checkers
				.filter( ( item: any ) => item.row === i )
				.map( ( item: any ) => (
					<Checker
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
	}
	return <>{ lanes }</>;
};
export default Lane;
