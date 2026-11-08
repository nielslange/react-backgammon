'use client';

import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { newGame } from '../data/gameSlice';
import { configureSession, isMatchOver, nextGame } from '../data/sessionSlice';
import type { AppDispatch, RootState } from '../data/store';
import { opponent } from '../engine/constants';
import type { GameResult } from '../engine/types';
import { PlayerType } from '../types/PlayerType';
import { Button } from './primitives/Button';
import { Dialog } from './primitives/Dialog';

const describeResult = ( result: GameResult, names: Record< string, string > ): string => {
	if ( result.kind === 'stalemate' ) return 'Neither player can move any more.';
	if ( result.winner === null ) return 'Both players finished on the last turn.';
	const loser = names[ opponent( result.winner ) ];
	switch ( result.kind ) {
		case 'resign':
			return `${ loser } resigned.`;
		case 'drop':
			return `${ loser } declined the double.`;
		case 'gammon':
			return `Gammon: ${ loser } had not borne off a checker.`;
		case 'backgammon':
			return `Backgammon: ${ loser } still had a checker on the bar or in the home board.`;
		default:
			return `${ names[ result.winner ] } bore off all checkers first.`;
	}
};

/** Result, points and match score, with the way forward. */
export const GameOverDialog = () => {
	const dispatch = useDispatch< AppDispatch >();
	const router = useRouter();
	const game = useSelector( ( root: RootState ) => root.game.state );
	const session = useSelector( ( root: RootState ) => root.session );
	if ( game.phase !== 'over' || ! game.result ) return null;

	const names = {
		[ PlayerType.PLAYER_ONE ]: session.players[ PlayerType.PLAYER_ONE ].name,
		[ PlayerType.PLAYER_TWO ]: session.players[ PlayerType.PLAYER_TWO ].name,
	};
	const result = game.result;
	const matchOver = isMatchOver( session.scores, session.matchTarget );
	const title =
		result.winner === null
			? 'Draw'
			: `${ names[ result.winner ] } wins the ${ matchOver ? 'match' : 'game' }`;
	const restart = { variant: game.variant, options: game.options };

	return (
		// A decision is required: Escape does not dismiss this dialog.
		<Dialog open title={ title } onClose={ () => {} }>
			<p className="text-sm text-muted">{ describeResult( result, names ) }</p>
			{ result.winner !== null && (
				<p className="mt-1 text-sm">
					+{ result.points } point{ result.points === 1 ? '' : 's' }
				</p>
			) }
			<div className="my-5 flex items-center justify-between rounded-control bg-canvas px-4 py-3 tabular-nums">
				<span className="truncate">{ names[ PlayerType.PLAYER_ONE ] }</span>
				<span className="px-3 text-xl font-semibold">
					{ session.scores[ PlayerType.PLAYER_ONE ] } – { session.scores[ PlayerType.PLAYER_TWO ] }
				</span>
				<span className="truncate text-right">{ names[ PlayerType.PLAYER_TWO ] }</span>
			</div>
			<p className="mb-4 text-xs text-muted">Match to { session.matchTarget }</p>
			<div className="flex flex-wrap gap-2">
				{ ! matchOver && (
					<Button
						variant="primary"
						className="flex-1"
						onClick={ () => {
							dispatch( nextGame() );
							dispatch( newGame( restart ) );
						} }
					>
						Next game
					</Button>
				) }
				<Button
					variant={ matchOver ? 'primary' : 'secondary' }
					className="flex-1"
					onClick={ () => {
						dispatch( configureSession( { players: session.players, matchTarget: session.matchTarget } ) );
						dispatch( newGame( restart ) );
					} }
				>
					New match
				</Button>
				<Button variant="ghost" onClick={ () => router.push( '/' ) }>
					Start screen
				</Button>
			</div>
		</Dialog>
	);
};
