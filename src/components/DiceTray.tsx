'use client';

import { clsx } from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import { selectPlayableDice } from '../data/selectors';
import type { AppDispatch, RootState } from '../data/store';
import { selectDie, setMode } from '../data/uiSlice';
import { getEngine } from '../engine';
import { effectiveDie } from '../ui/moveInput';
import { Die } from './Die';
import { Switch } from './primitives/Switch';

type Face = { value: number; used: boolean };

/** Every die of the physical roll, in play order, with the played ones marked. */
const facesOf = ( root: RootState ): Face[] => {
	const game = root.game.state;
	if ( ! game.roll || game.phase !== 'moving' ) return [];
	const all = getEngine( game.variant ).expandRoll( game.roll, game.options );
	const remaining = [ ...game.dice ];
	const faces = all.map( ( value ) => {
		const i = remaining.indexOf( value );
		if ( i === -1 ) return { value, used: true };
		remaining.splice( i, 1 );
		return { value, used: false };
	} );
	// Played dice first, so the dice still to play sit together on the right.
	return [
		...faces.filter( ( f ) => f.used ),
		...faces.filter( ( f ) => ! f.used ),
	];
};

const statusText = ( root: RootState ): string | null => {
	const { phase, player } = root.game.state;
	if ( phase === 'idle' ) return 'Start a game to roll.';
	if ( phase === 'opening' ) return 'Waiting for the opening roll…';
	if ( phase === 'over' ) return 'Game over.';
	if ( phase === 'awaiting-roll' && player ) {
		return `${ root.session.players[ player ].name } is rolling…`;
	}
	return null;
};

/**
 * The dice of the current turn. In beginner mode they only show what is
 * left; in advanced mode they are buttons that choose the die to play.
 */
export const DiceTray = ( {
	className,
	onBoard = false,
}: {
	className?: string;
	/** The dice lie on the felt (phones): give the status text a surface. */
	onBoard?: boolean;
} ) => {
	const dispatch = useDispatch< AppDispatch >();
	const faces = useSelector(
		facesOf,
		( a, b ) => JSON.stringify( a ) === JSON.stringify( b )
	);
	const status = useSelector( statusText );
	const roll = useSelector( ( root: RootState ) => root.game.state.roll );
	const mode = useSelector( ( root: RootState ) => root.ui.mode );
	const playable = useSelector( selectPlayableDice );
	const chosen = useSelector( effectiveDie );
	const ordered = useSelector(
		( root: RootState ) => getEngine( root.game.state.variant ).orderedDice
	);
	const nextIndex = faces.findIndex( ( f ) => ! f.used );
	const advanced = mode === 'advanced';
	// Remounting the dice on every new roll replays the roll animation.
	const rollKey = roll ? roll.join( '-' ) + faces.length : 'none';

	return (
		<div
			key={ rollKey }
			className={ clsx(
				'dice-tray flex min-h-10 flex-wrap items-center gap-2 sm:min-h-12',
				className
			) }
			data-mode={ mode }
		>
			{ faces.length === 0 && (
				<span
					className={
						onBoard
							? 'rounded-control bg-surface px-3 py-2 text-sm text-ink shadow-raised'
							: 'text-sm text-muted'
					}
				>
					{ status }
				</span>
			) }
			{ faces.map( ( face, index ) => {
				const isNext = ordered && index === nextIndex;
				const blocked =
					! face.used &&
					( ordered ? isNext : true ) &&
					! playable.includes( face.value );
				const die = (
					<Die
						value={ face.value }
						used={ face.used }
						blocked={ blocked }
						selected={
							advanced &&
							! face.used &&
							! ordered &&
							chosen === face.value
						}
						next={ isNext }
						decorative={ advanced && ! face.used && ! ordered }
						className="animate-die-roll"
					/>
				);
				// Ordered dice leave nothing to choose: show them, never as buttons.
				if ( ! advanced || face.used || ordered ) {
					return <span key={ index }>{ die }</span>;
				}
				return (
					<button
						key={ index }
						type="button"
						aria-label={ `Play the ${ face.value }` }
						aria-pressed={ chosen === face.value }
						disabled={ blocked }
						onClick={ () => dispatch( selectDie( face.value ) ) }
						className={ clsx(
							'rounded-[12px] disabled:cursor-not-allowed'
						) }
					>
						{ die }
					</button>
				);
			} ) }
		</div>
	);
};

/** Beginner (checker, then point) or advanced (die, then checker) input. */
export const ModeSwitch = () => {
	const dispatch = useDispatch< AppDispatch >();
	const advanced = useSelector(
		( root: RootState ) => root.ui.mode === 'advanced'
	);
	return (
		<Switch
			label="Advanced"
			description="Pick a die, then a checker."
			checked={ advanced }
			onChange={ ( on ) =>
				dispatch( setMode( on ? 'advanced' : 'beginner' ) )
			}
		/>
	);
};
