'use client';

import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record< Variant, string > = {
	primary:
		'bg-accent text-accent-ink hover:brightness-105 disabled:border disabled:border-line disabled:bg-canvas disabled:text-muted',
	secondary:
		'bg-surface text-ink border border-control hover:bg-canvas disabled:border-line disabled:text-muted disabled:hover:bg-surface',
	ghost: 'text-ink underline-offset-4 hover:bg-canvas hover:underline disabled:text-muted',
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
			'inline-flex min-h-9 items-center justify-center rounded-control px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed',
			VARIANTS[ variant ],
			className
		) }
		{ ...rest }
	/>
);
