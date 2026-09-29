/**
 * External dependencies
 */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { clsx } from 'clsx';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { rollDice, selectDie } from '../data/actions';
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

export const Dice = () => {
	const dispatch = useDispatch();
	const dice = useSelector( ( state: StateType ) => state.dice );
	const selectedDie = useSelector(
		( state: StateType ) => state.selectedDie
	);
	const gameOver = useSelector( ( state: StateType ) => state.gameOver );
	const checkers = useSelector( ( state: StateType ) => state.checkers );
	const currentPlayer = useSelector(
		( state: StateType ) => state.currentPlayer
	);

	const playableDice = getPlayableDice( { dice, checkers, currentPlayer } );
	const effectiveDie = getEffectiveDie( { dice, selectedDie, playableDice } );

	return (
		<div>
			<h2 className="h6">Dice.tsx</h2>

			<div className="dice-tray" aria-label="Dice">
				{ dice.length === 0 && (
					<span className="dice-tray__empty">No dice rolled</span>
				) }
				{ dice.map( ( die, index ) => {
					const playable = ! gameOver && playableDice.includes( die );
					return (
						<button
							key={ `${ index }-${ die }` }
							type="button"
							className={ clsx(
								'die',
								effectiveDie === die && 'die--selected'
							) }
							data-die={ die }
							aria-label={ `Die ${ die }` }
							aria-pressed={ effectiveDie === die }
							title={
								playable
									? `Play the ${ die }`
									: 'This die cannot be played right now'
							}
							disabled={ ! playable }
							onClick={ () => dispatch( selectDie( die ) ) }
						>
							<img src={ DIE_ICONS[ die ] } alt="" />
						</button>
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
