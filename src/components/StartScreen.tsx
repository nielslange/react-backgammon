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
		available: false,
	},
];

/** Two stacked checkers as a tiny emblem for a variant card. */
const Emblem = ( { muted }: { muted: boolean } ) => (
	<svg aria-hidden="true" viewBox="0 0 40 40" className={ clsx( 'size-10 shrink-0', muted && 'opacity-50' ) }>
		<circle cx="15" cy="24" r="11" className="fill-checker-dark stroke-checker-dark-edge" strokeWidth="1.5" />
		<circle cx="25" cy="16" r="11" className="fill-checker-light stroke-checker-light-edge" strokeWidth="1.5" />
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
			<div className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 focus-within:outline-2 focus-within:outline-accent">
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
		// A double cannot change a 1-point match, so it plays without the cube.
		dispatch( newGame( { variant, options: { cube: cube && length !== '1' } } ) );
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
									checked ? 'border-accent shadow-raised' : 'border-line hover:shadow-raised'
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
					{ value: 'ai', label: 'Computer', disabled: true, hint: 'Coming soon' },
					{ value: 'online', label: 'Online', disabled: true, hint: 'Coming soon' },
				] }
			/>

			<div className="grid gap-4 sm:grid-cols-2">
				<NameField
					label="Light player"
					value={ blue }
					onChange={ setBlue }
					swatch="bg-checker-light border-checker-light-edge"
				/>
				<NameField
					label="Dark player"
					value={ red }
					onChange={ setRed }
					swatch="bg-checker-dark border-checker-dark-edge"
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
				<Switch
					label="Doubling cube"
					checked={ cube && length !== '1' }
					onChange={ setCube }
					disabled={ length === '1' }
					className="pb-2"
				/>
			</div>

			<div>
				<Button variant="primary" onClick={ start } className="min-h-11 px-6 text-base">
					Start game
				</Button>
			</div>
		</section>
	);
};
