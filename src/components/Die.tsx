'use client';

import { clsx } from 'clsx';

/** Pip positions on a 3×3 grid (0..2), per face value. */
const PIPS: Record< number, Array< [ number, number ] > > = {
	1: [ [ 1, 1 ] ],
	2: [ [ 0, 0 ], [ 2, 2 ] ],
	3: [ [ 0, 0 ], [ 1, 1 ], [ 2, 2 ] ],
	4: [ [ 0, 0 ], [ 2, 0 ], [ 0, 2 ], [ 2, 2 ] ],
	5: [ [ 0, 0 ], [ 2, 0 ], [ 1, 1 ], [ 0, 2 ], [ 2, 2 ] ],
	6: [ [ 0, 0 ], [ 0, 1 ], [ 0, 2 ], [ 2, 0 ], [ 2, 1 ], [ 2, 2 ] ],
};

type Props = {
	value: number;
	/** Already played this turn. */
	used?: boolean;
	/** Cannot be played right now. */
	blocked?: boolean;
	selected?: boolean;
	decorative?: boolean;
	className?: string;
};

/** One die drawn as SVG, ivory with dark pips. */
export const Die = ( { value, used, blocked, selected, decorative, className }: Props ) => {
	const label = `Die showing ${ value }${ used ? ', used' : '' }${ blocked && ! used ? ', cannot be played' : '' }`;
	return (
		<svg
			viewBox="0 0 48 48"
			role={ decorative ? undefined : 'img' }
			aria-hidden={ decorative ? true : undefined }
			aria-label={ decorative ? undefined : label }
			aria-disabled={ ! decorative && ( used || blocked ) ? true : undefined }
			className={ clsx(
				'size-12 shrink-0 transition-opacity',
				( used || blocked ) && 'opacity-35',
				className
			) }
		>
			<rect
				x="2"
				y="2"
				width="44"
				height="44"
				rx="10"
				fill="var(--color-checker-light)"
				stroke={ selected ? 'var(--color-accent)' : 'var(--color-checker-light-edge)' }
				strokeWidth={ selected ? 4 : 1.5 }
			/>
			{ PIPS[ value ]?.map( ( [ col, row ], i ) => (
				<circle
					key={ i }
					data-pip
					cx={ 12 + col * 12 }
					cy={ 12 + row * 12 }
					r="4.2"
					fill="var(--color-checker-dark)"
				/>
			) ) }
		</svg>
	);
};
