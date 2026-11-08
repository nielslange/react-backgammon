'use client';

/**
 * External dependencies
 */
import { clsx } from 'clsx';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { selectPlayableDice } from '../data/selectors';
import type { AppDispatch, RootState } from '../data/store';
import { selectDie, setMode } from '../data/uiSlice';
import { effectiveDie } from '../ui/moveInput';
import diceOne from '../icons/dice-one-solid.svg';
import diceTwo from '../icons/dice-two-solid.svg';
import diceThree from '../icons/dice-three-solid.svg';
import diceFour from '../icons/dice-four-solid.svg';
import diceFive from '../icons/dice-five-solid.svg';
import diceSix from '../icons/dice-six-solid.svg';

// Next returns static image objects for SVG imports, Vitest returns URLs.
const url = ( icon: string | { src: string } ) =>
	typeof icon === 'string' ? icon : icon.src;

const DIE_ICONS: Record< number, string | { src: string } > = {
	1: diceOne,
	2: diceTwo,
	3: diceThree,
	4: diceFour,
	5: diceFive,
	6: diceSix,
};

/**
 * Shows the dice still to be played this turn; dice that cannot be played
 * are dimmed. In beginner mode they are indicators only (click a checker,
 * then a highlighted point). In advanced mode click a die to select it,
 * then a checker click moves immediately. Dice are rolled by the game
 * itself; there is no roll button.
 */
export const Dice = () => {
	const dispatch = useDispatch< AppDispatch >();
	const dice = useSelector( ( root: RootState ) => root.game.state.dice );
	const gameOver = useSelector(
		( root: RootState ) => root.game.state.phase === 'over'
	);
	const mode = useSelector( ( root: RootState ) => root.ui.mode );
	const playableDice = useSelector( selectPlayableDice );
	const selected = useSelector( effectiveDie );

	const advanced = mode === 'advanced';
	const current = advanced ? selected : null;

	return (
		<div>
			<h2 className="h6">Dice.tsx</h2>

			<label
				htmlFor="beginner-mode"
				className="mb-2 flex cursor-pointer items-center gap-2 text-sm"
			>
				<input
					type="checkbox"
					role="switch"
					id="beginner-mode"
					className="size-4 accent-accent"
					checked={ ! advanced }
					onChange={ ( event ) =>
						dispatch(
							setMode( event.target.checked ? 'beginner' : 'advanced' )
						)
					}
				/>
				{ advanced
					? 'Advanced mode: select a die, then click a checker'
					: 'Beginner mode: click a checker, then a highlighted point' }
			</label>

			<div className="dice-tray" aria-label="Dice" data-mode={ mode }>
				{ dice.length === 0 && (
					<span className="dice-tray__empty">No dice rolled</span>
				) }
				{ dice.map( ( die, index ) => {
					const playable = ! gameOver && playableDice.includes( die );
					const className = clsx(
						'die',
						! playable && 'die--unplayable',
						current === die && 'die--selected'
					);
					const title = playable
						? advanced
							? `Play the ${ die }`
							: `${ die } can be played`
						: `${ die } cannot be played right now`;

					return advanced ? (
						<button
							key={ `${ index }-${ die }` }
							type="button"
							className={ className }
							data-die={ die }
							data-playable={ playable }
							aria-label={ `Die ${ die }` }
							aria-pressed={ current === die }
							title={ title }
							disabled={ ! playable }
							onClick={ () => dispatch( selectDie( die ) ) }
						>
							<img src={ url( DIE_ICONS[ die ] ) } alt="" />
						</button>
					) : (
						<div
							key={ `${ index }-${ die }` }
							className={ className }
							data-die={ die }
							data-playable={ playable }
							role="img"
							aria-label={ `Die ${ die }` }
							title={ title }
						>
							<img src={ url( DIE_ICONS[ die ] ) } alt="" />
						</div>
					);
				} ) }
			</div>
		</div>
	);
};
