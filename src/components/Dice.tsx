/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import { clsx } from 'clsx';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { rollDice, selectDie, setMode } from '../data/actions';
import {
	getEffectiveDie,
	getPlayableDice,
} from '../helpers/moveSelectionHelper';
import { StateType } from '../types';
import diceOne from '../icons/dice-one-solid.svg';
import diceTwo from '../icons/dice-two-solid.svg';
import diceThree from '../icons/dice-three-solid.svg';
import diceFour from '../icons/dice-four-solid.svg';
import diceFive from '../icons/dice-five-solid.svg';
import diceSix from '../icons/dice-six-solid.svg';

const DIE_ICONS: Record< number, string > = {
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
 * then a checker click moves immediately.
 */
export const Dice = () => {
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const mode = useSelector( ( state: StateType ) => state.mode );
	const selectedDie = useSelector(
		( state: StateType ) => state.selectedDie
	);
	const gameOver = useSelector( ( state: StateType ) => state.gameOver );
	const checkers = useSelector( ( state: StateType ) => state.checkers );
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);

	const advanced = mode === 'advanced';
	const playableDice = getPlayableDice( { dice, checkers, currentPlayer } );
	const effectiveDie = advanced
		? getEffectiveDie( { dice, selectedDie, playableDice } )
		: null;

	return (
		<div>
			<h2 className="h6">Dice.tsx</h2>

			<Form.Check
				type="switch"
				id="beginner-mode"
				className="mb-2"
				label={
					advanced
						? 'Advanced mode: select a die, then click a checker'
						: 'Beginner mode: click a checker, then a highlighted point'
				}
				checked={ ! advanced }
				onChange={ ( event ) =>
					dispatch(
						setMode(
							event.target.checked ? 'beginner' : 'advanced'
						)
					)
				}
			/>

			<div className="dice-tray" aria-label="Dice" data-mode={ mode }>
				{ dice.length === 0 && (
					<span className="dice-tray__empty">No dice rolled</span>
				) }
				{ dice.map( ( die, index ) => {
					const playable = ! gameOver && playableDice.includes( die );
					const className = clsx(
						'die',
						! playable && 'die--unplayable',
						effectiveDie === die && 'die--selected'
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
							aria-pressed={ effectiveDie === die }
							title={ title }
							disabled={ ! playable }
							onClick={ () => dispatch( selectDie( die ) ) }
						>
							<img src={ DIE_ICONS[ die ] } alt="" />
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
							<img src={ DIE_ICONS[ die ] } alt="" />
						</div>
					);
				} ) }
			</div>

			<ButtonGroup aria-label="Dice actions" className="mb-3">
				<Button
					aria-label="Roll the dice"
					variant="outline-primary btn-sm"
					onClick={ () => dispatch( rollDice() ) }
					disabled={ gameOver || dice.length > 0 }
					title={
						dice.length > 0
							? 'You have already rolled this turn'
							: undefined
					}
				>
					Roll
				</Button>
			</ButtonGroup>
		</div>
	);
};
