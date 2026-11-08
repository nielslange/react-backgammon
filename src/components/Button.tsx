'use client';

import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record< Variant, string > = {
	primary: 'bg-accent text-accent-ink hover:brightness-105',
	secondary: 'bg-surface text-ink border border-line hover:bg-canvas',
	ghost: 'text-ink hover:bg-canvas',
};

export const Button = ( {
	variant = 'secondary',
	className,
	type = 'button',
	...rest
}: ButtonHTMLAttributes< HTMLButtonElement > & { variant?: Variant } ) => (
	<button
		type={ type }
		className={ clsx(
			'inline-flex min-h-9 items-center justify-center rounded-control px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
			VARIANTS[ variant ],
			className
		) }
		{ ...rest }
	/>
);
