/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { newGame, resign, undoStep } from '../data/gameSlice';
import type { AppDispatch, RootState } from '../data/store';

export const GameState = () => {
	const dispatch = useDispatch< AppDispatch >();
	const phase = useSelector( ( root: RootState ) => root.game.state.phase );
	const player = useSelector( ( root: RootState ) => root.game.state.player );
	const canUndo = useSelector(
		( root: RootState ) =>
			root.game.state.phase === 'moving' &&
			root.game.state.turnSteps.length > 0
	);
	const inPlay =
		player !== null && ( phase === 'moving' || phase === 'awaiting-roll' );

	return (
		<>
			<h2 className="h6">GameState.tsx</h2>
			<ButtonGroup aria-label="Game actions" className="mb-3">
				<Button
					aria-label="Restart the game"
					variant="outline-secondary btn-sm"
					onClick={ () =>
						dispatch( newGame( { variant: 'backgammon' } ) )
					}
				>
					Restart
				</Button>
				<Button
					aria-label="Resign the game"
					variant="outline-secondary btn-sm"
					onClick={ () =>
						player !== null && dispatch( resign( { player } ) )
					}
					disabled={ ! inPlay }
				>
					Resign
				</Button>
				<Button
					aria-label="Undo last move"
					variant="outline-secondary btn-sm"
					onClick={ () => dispatch( undoStep() ) }
					disabled={ ! canUndo }
				>
					Undo
				</Button>
			</ButtonGroup>
		</>
	);
};
