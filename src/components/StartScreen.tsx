'use client';

import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { useDispatch } from 'react-redux';
import { newGame } from '../data/gameSlice';
import { configureSession } from '../data/sessionSlice';
import type { AppDispatch } from '../data/store';
import type { VariantId } from '../engine/types';
import { PlayerType } from '../types';
import { Button } from './primitives/Button';
import { Segmented } from './primitives/Segmented';
import { Switch } from './primitives/Switch';

type Opponent = 'local' | 'ai' | 'online';
type Length = '1' | '3' | '5' | '7';
type Rerolls = 'unlimited' | '1' | '2';
type PerPoint = 'none' | '5' | '3';

const VARIANTS: Array< {
	id: VariantId;
	title: string;
	blurb: string;
	available: boolean;
} > = [
	{
		id: 'backgammon',
		title: 'Backgammon',
		blurb: 'The classic race with hitting, the doubling cube and gammons.',
		available: true,
	},
	{
		id: 'triktrak',
		title: 'Triktrak',
		blurb: 'The Dutch game: enter all fifteen checkers, doubles roll again.',
		available: true,
	},
];

/** Two stacked checkers as a tiny emblem for a variant card. */
const Emblem = ( { muted }: { muted: boolean } ) => (
	<svg aria-hidden="true" viewBox="0 0 40 40" className={ clsx( 'size-10 shrink-0', muted && 'grayscale' ) }>
		<circle cx="15" cy="24" r="11" className="fill-checker-dark stroke-checker-dark-rim" strokeWidth="1.5" />
		<circle cx="25" cy="16" r="11" className="fill-checker-light stroke-checker-light-rim" strokeWidth="1.5" />
	</svg>
);

const NameField = ( {
	label,
	value,
	onChange,
	swatch,
}: {
	label: string;
	value: string;
	onChange: ( value: string ) => void;
	swatch: string;
} ) => {
	const id = useId();
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={ id } className="text-xs font-medium uppercase tracking-wide text-muted">
				{ label }
			</label>
			<div className="flex items-center gap-2 rounded-control border border-control bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
				<span aria-hidden="true" className={ clsx( 'size-3.5 rounded-full border', swatch ) } />
				<input
					id={ id }
					value={ value }
					maxLength={ 24 }
					autoComplete="off"
					onChange={ ( e ) => onChange( e.target.value ) }
					className="min-h-10 w-full bg-transparent text-base outline-none"
				/>
			</div>
		</div>
	);
};

export const StartScreen = () => {
	const dispatch = useDispatch< AppDispatch >();
	const router = useRouter();
	const [ variant, setVariant ] = useState< VariantId >( 'backgammon' );
	const [ opponent, setOpponent ] = useState< Opponent >( 'local' );
	const [ blue, setBlue ] = useState( 'Light' );
	const [ red, setRed ] = useState( 'Dark' );
	const [ length, setLength ] = useState< Length >( '1' );
	const [ cube, setCube ] = useState( true );
	const [ rerolls, setRerolls ] = useState< Rerolls >( 'unlimited' );
	const [ onlyIfCompleted, setOnlyIfCompleted ] = useState( true );
	const [ enterOnDoubles, setEnterOnDoubles ] = useState( false );
	const [ perPoint, setPerPoint ] = useState< PerPoint >( 'none' );
	const [ finalTurn, setFinalTurn ] = useState( true );
	const variantLabel = useId();

	const start = () => {
		dispatch(
			configureSession( {
				players: {
					[ PlayerType.PLAYER_ONE ]: { kind: 'human', name: blue.trim() || 'Light' },
					[ PlayerType.PLAYER_TWO ]: { kind: 'human', name: red.trim() || 'Dark' },
				},
				matchTarget: Number( length ),
			} )
		);
		const options =
			variant === 'triktrak'
				? {
						cube: false,
						rerollLimit: rerolls === 'unlimited' ? null : Number( rerolls ),
						rerollOnlyIfCompleted: onlyIfCompleted,
						enterOnlyOnDoubles: enterOnDoubles,
						maxCheckersPerPoint: perPoint === 'none' ? null : Number( perPoint ),
						finalTurnForSecondPlayer: finalTurn,
				  }
				: // A double cannot change a 1-point match, so it plays without the cube.
				  { cube: cube && length !== '1' };
		dispatch( newGame( { variant, options } ) );
		router.push( '/game' );
	};

	return (
		<section className="mx-auto flex max-w-2xl flex-col gap-8 pt-4 sm:pt-10">
			<div>
				<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
					Roll the dice.
				</h1>
				<p className="mt-2 max-w-prose text-muted">
					Pick a game, set up the table, and play on one screen with a friend.
				</p>
			</div>

			<div className="flex flex-col gap-2">
				<span id={ variantLabel } className="text-xs font-medium uppercase tracking-wide text-muted">
					Game
				</span>
				<div role="radiogroup" aria-labelledby={ variantLabel } className="grid gap-3 sm:grid-cols-2">
					{ VARIANTS.map( ( v ) => {
						const checked = v.id === variant;
						return (
							<button
								key={ v.id }
								type="button"
								role="radio"
								aria-checked={ checked }
								tabIndex={ checked ? 0 : -1 }
								disabled={ ! v.available }
								onClick={ () => setVariant( v.id ) }
								className={ clsx(
									'flex items-start gap-3 rounded-card border bg-surface p-4 text-left transition-shadow disabled:cursor-not-allowed',
									checked
										? 'border-2 border-focus shadow-raised'
										: 'border-2 border-control enabled:hover:shadow-raised disabled:border-dashed disabled:border-line'
								) }
							>
								<Emblem muted={ ! v.available } />
								<span className="flex flex-col gap-1">
									<span className="flex items-center gap-2 font-semibold">
										{ v.title }
										{ ! v.available && (
											<span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
												Coming soon
											</span>
										) }
									</span>
									<span className="text-sm text-muted">{ v.blurb }</span>
								</span>
							</button>
						);
					} ) }
				</div>
			</div>

			<Segmented< Opponent >
				label="Opponent"
				value={ opponent }
				onChange={ setOpponent }
				options={ [
					{ value: 'local', label: 'Local' },
					{ value: 'ai', label: 'Computer (soon)', disabled: true, hint: 'Coming soon' },
					{ value: 'online', label: 'Online (soon)', disabled: true, hint: 'Coming soon' },
				] }
			/>

			<div className="grid gap-4 sm:grid-cols-2">
				<NameField
					label="Light player"
					value={ blue }
					onChange={ setBlue }
					swatch="bg-checker-light border-checker-light-rim"
				/>
				<NameField
					label="Dark player"
					value={ red }
					onChange={ setRed }
					swatch="bg-checker-dark border-checker-dark-rim"
				/>
			</div>

			<div className="flex flex-wrap items-end gap-6">
				<Segmented< Length >
					label="Match length"
					value={ length }
					onChange={ setLength }
					options={ [
						{ value: '1', label: '1 point' },
						{ value: '3', label: '3 points' },
						{ value: '5', label: '5 points' },
						{ value: '7', label: '7 points' },
					] }
				/>
				{ variant === 'backgammon' && (
					<Switch
						label="Doubling cube"
						checked={ cube && length !== '1' }
						onChange={ setCube }
						disabled={ length === '1' }
						className="pb-2"
					/>
				) }
			</div>

			{ variant === 'triktrak' && (
				<fieldset className="flex flex-col gap-5 rounded-card border-2 border-line p-4">
					<legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted">
						Triktrak rules
					</legend>
					<div className="flex flex-wrap gap-6">
						<Segmented< Rerolls >
							label="Bonus rolls per turn"
							value={ rerolls }
							onChange={ setRerolls }
							options={ [
								{ value: 'unlimited', label: 'Unlimited' },
								{ value: '1', label: 'Once' },
								{ value: '2', label: 'Twice' },
							] }
						/>
						<Segmented< PerPoint >
							label="Checkers per point"
							value={ perPoint }
							onChange={ setPerPoint }
							options={ [
								{ value: 'none', label: 'No limit' },
								{ value: '5', label: '5' },
								{ value: '3', label: '3' },
							] }
						/>
					</div>
					<div className="flex flex-col gap-3">
						<Switch
							label="Bonus roll only when all dice were played"
							checked={ onlyIfCompleted }
							onChange={ setOnlyIfCompleted }
						/>
						<Switch label="Enter only on doubles" checked={ enterOnDoubles } onChange={ setEnterOnDoubles } />
						<Switch
							label="Final turn for the second player"
							checked={ finalTurn }
							onChange={ setFinalTurn }
						/>
					</div>
				</fieldset>
			) }

			<div>
				<Button variant="primary" onClick={ start } className="min-h-11 px-6 text-base">
					Start game
				</Button>
			</div>
		</section>
	);
};
