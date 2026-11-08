'use client';

import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { offerDouble, resign, undoStep } from '../data/gameSlice';
import { requestRoll } from '../data/intents';
import { selectCanDouble, selectCubeAllowed, selectSeatToAct } from '../data/selectors';
import type { AppDispatch, RootState } from '../data/store';
import { getEngine } from '../engine';
import { Button } from './primitives/Button';

/** The actions of the player to move: roll, double, undo, resign. */
export const ActionBar = () => {
	const dispatch = useDispatch< AppDispatch >();
	const router = useRouter();
	const game = useSelector( ( root: RootState ) => root.game.state );
	const seat = useSelector( selectSeatToAct );
	const canDouble = useSelector( selectCanDouble );
	const cubeAllowed = useSelector( selectCubeAllowed );
	const cubeInGame = game.options.cube && getEngine( game.variant ).supportsCube;

	const local = seat !== null && seat.kind === 'human';
	const awaitingRoll = game.phase === 'awaiting-roll' && ! game.cube.offered;
	const inPlay = game.player !== null && ( game.phase === 'moving' || game.phase === 'awaiting-roll' );
	const canUndo = game.phase === 'moving' && game.turnSteps.length > 0;

	return (
		<div className="flex flex-col gap-3">
			{ local && awaitingRoll && (
				<div className="flex gap-2">
					<Button variant="primary" className="min-h-11 flex-1 text-base" onClick={ () => dispatch( requestRoll() ) }>
						Roll
					</Button>
					{ cubeInGame && cubeAllowed && (
						<Button
							className="min-h-11 flex-1 text-base"
							disabled={ ! canDouble }
							onClick={ () => game.player && dispatch( offerDouble( { player: game.player } ) ) }
						>
							Double
						</Button>
					) }
				</div>
			) }
			<div role="group" aria-label="Game actions" className="flex flex-wrap gap-2">
				<Button onClick={ () => dispatch( undoStep() ) } disabled={ ! canUndo } aria-label="Undo">
					Undo
				</Button>
				<Button
					onClick={ () => game.player && dispatch( resign( { player: game.player } ) ) }
					disabled={ ! inPlay }
				>
					Resign
				</Button>
				<Button variant="ghost" onClick={ () => router.push( '/' ) }>
					New game
				</Button>
			</div>
			{ cubeInGame && game.cube.owner === null && game.phase !== 'idle' && (
				<p className="text-xs text-muted">
					Cube in the middle at { game.cube.value }
					{ ! cubeAllowed && ' · Crawford game, no doubling' }
				</p>
			) }
		</div>
	);
};
