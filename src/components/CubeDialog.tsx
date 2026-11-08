'use client';

import { useDispatch, useSelector } from 'react-redux';
import { acceptDouble, dropDouble } from '../data/gameSlice';
import type { AppDispatch, RootState } from '../data/store';
import { opponent } from '../engine/constants';
import { Button } from './primitives/Button';
import { Dialog } from './primitives/Dialog';

/** Asks the opponent of the doubling player to take or drop. */
export const CubeDialog = () => {
	const dispatch = useDispatch< AppDispatch >();
	const game = useSelector( ( root: RootState ) => root.game.state );
	const players = useSelector( ( root: RootState ) => root.session.players );
	if ( ! game.cube.offered || game.player === null ) return null;
	// The computer answers for itself.
	if ( players[ opponent( game.player ) ].kind !== 'human' ) return null;

	const doubler = players[ game.player ].name;
	const taker = players[ opponent( game.player ) ].name;
	const next = game.cube.value * 2;

	return (
		<Dialog open title={ `${ doubler } doubles to ${ next }` } onClose={ () => {} }>
			<p className="mb-5 text-sm text-muted">
				{ taker }, take and play on for { next } points, or drop and give up this game for{ ' ' }
				{ game.cube.value } point{ game.cube.value === 1 ? '' : 's' }.
			</p>
			<div className="flex gap-2">
				<Button variant="primary" className="flex-1" onClick={ () => dispatch( acceptDouble() ) }>
					Take
				</Button>
				<Button className="flex-1" onClick={ () => dispatch( dropDouble() ) }>
					Drop
				</Button>
			</div>
		</Dialog>
	);
};
