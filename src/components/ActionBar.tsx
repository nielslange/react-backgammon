'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { offerDouble, resign, undoStep } from '../data/gameSlice';
import { requestRoll } from '../data/intents';
import { selectAwaitsHumanRoll, selectCanDouble } from '../data/selectors';
import type { AppDispatch, RootState } from '../data/store';
import { opponent } from '../engine/constants';
import { getEngine } from '../engine';
import { Button } from './primitives/Button';
import { Dialog } from './primitives/Dialog';
import { selectCubeAllowed } from '../data/selectors';

/** The actions of the player to move: roll, double, undo, resign. */
export const ActionBar = () => {
	const dispatch = useDispatch< AppDispatch >();
	const router = useRouter();
	const game = useSelector( ( root: RootState ) => root.game.state );
	const players = useSelector( ( root: RootState ) => root.session.players );
	const awaitsRoll = useSelector( selectAwaitsHumanRoll );
	const canDouble = useSelector( selectCanDouble );
	const cubeAllowed = useSelector( selectCubeAllowed );
	const [ confirmResign, setConfirmResign ] = useState( false );
	const cubeInGame = game.options.cube && getEngine( game.variant ).supportsCube;

	const humans = ( Object.keys( players ) as Array< keyof typeof players > ).filter( ( p ) => players[ p ].kind === 'human' );
	const humanToAct = game.player !== null && players[ game.player ].kind === 'human';
	// With one human at the table, Resign always means that human.
	const resigner = humans.length === 1 ? humans[ 0 ] : game.player;
	const inPlay = resigner !== null && ( game.phase === 'moving' || game.phase === 'awaiting-roll' );
	const canUndo = humanToAct && game.phase === 'moving' && game.turnSteps.length > 0;
	const winner = resigner ? players[ opponent( resigner ) ].name : '';

	return (
		<div className="flex flex-col gap-3">
			{ awaitsRoll && (
				<div className="flex gap-2">
					<Button variant="primary" className="min-h-11 flex-1 text-base" onClick={ () => dispatch( requestRoll() ) }>
						Roll
					</Button>
					<Button
						className="min-h-11 flex-1 text-base"
						disabled={ ! canDouble }
						onClick={ () => game.player && dispatch( offerDouble( { player: game.player } ) ) }
					>
						Double
					</Button>
				</div>
			) }
			<div role="group" aria-label="Game actions" className="flex flex-wrap gap-2">
				<Button onClick={ () => dispatch( undoStep() ) } disabled={ ! canUndo } aria-label="Undo">
					Undo
				</Button>
				<Button onClick={ () => setConfirmResign( true ) } disabled={ ! inPlay }>
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
			<Dialog open={ confirmResign && inPlay } title="Resign this game?" onClose={ () => setConfirmResign( false ) }>
				<p className="mb-5 text-sm text-muted">
					{ winner } gets { game.cube.value } point{ game.cube.value === 1 ? '' : 's' }.
				</p>
				<div className="flex gap-2">
					<Button className="flex-1" onClick={ () => setConfirmResign( false ) }>
						Keep playing
					</Button>
					<Button
						variant="primary"
						className="flex-1"
						onClick={ () => {
							setConfirmResign( false );
							if ( resigner ) dispatch( resign( { player: resigner } ) );
						} }
					>
						Resign game
					</Button>
				</div>
			</Dialog>
		</div>
	);
};
