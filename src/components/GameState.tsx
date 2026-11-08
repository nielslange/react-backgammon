'use client';

/**
 * External dependencies
 */
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { newGame, resign, undoStep } from '../data/gameSlice';
import type { AppDispatch, RootState } from '../data/store';
import { Button } from './primitives/Button';

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
			<div role="group" aria-label="Game actions" className="mb-3 flex gap-2">
				<Button
					aria-label="Restart the game"
					variant="secondary"
					onClick={ () =>
						dispatch( newGame( { variant: 'backgammon' } ) )
					}
				>
					Restart
				</Button>
				<Button
					aria-label="Resign the game"
					variant="secondary"
					onClick={ () =>
						player !== null && dispatch( resign( { player } ) )
					}
					disabled={ ! inPlay }
				>
					Resign
				</Button>
				<Button
					aria-label="Undo last move"
					variant="secondary"
					onClick={ () => dispatch( undoStep() ) }
					disabled={ ! canUndo }
				>
					Undo
				</Button>
			</div>
		</>
	);
};
