'use client';

import { clsx } from 'clsx';
import { useId, useRef, type KeyboardEvent } from 'react';

export type SegmentedOption< T extends string > = {
	value: T;
	label: string;
	hint?: string;
	disabled?: boolean;
};

type Props< T extends string > = {
	label: string;
	value: T;
	options: SegmentedOption< T >[];
	onChange: ( value: T ) => void;
	className?: string;
};

/**
 * A single-choice control rendered as a row of buttons. Follows the ARIA
 * radiogroup pattern: one tab stop, arrow keys move and select.
 */
export const Segmented = < T extends string >( {
	label,
	value,
	options,
	onChange,
	className,
}: Props< T > ) => {
	const labelId = useId();
	const refs = useRef< Array< HTMLButtonElement | null > >( [] );

	const move = ( from: number, delta: number ) => {
		const n = options.length;
		for ( let i = 1; i <= n; i++ ) {
			const next = ( from + delta * i + n * n ) % n;
			if ( ! options[ next ].disabled ) {
				onChange( options[ next ].value );
				refs.current[ next ]?.focus();
				return;
			}
		}
	};

	const onKeyDown = ( event: KeyboardEvent, index: number ) => {
		if ( event.key === 'ArrowRight' || event.key === 'ArrowDown' ) {
			event.preventDefault();
			move( index, 1 );
		} else if ( event.key === 'ArrowLeft' || event.key === 'ArrowUp' ) {
			event.preventDefault();
			move( index, -1 );
		}
	};

	return (
		<div className={ clsx( 'flex flex-col gap-1.5', className ) }>
			<span id={ labelId } className="text-xs font-medium uppercase tracking-wide text-muted">
				{ label }
			</span>
			<div
				role="radiogroup"
				aria-labelledby={ labelId }
				className="inline-flex flex-wrap gap-1 rounded-control border border-line bg-canvas p-1"
			>
				{ options.map( ( option, index ) => {
					const checked = option.value === value;
					return (
						<button
							key={ option.value }
							ref={ ( el ) => {
								refs.current[ index ] = el;
							} }
							type="button"
							role="radio"
							aria-checked={ checked }
							tabIndex={ checked ? 0 : -1 }
							disabled={ option.disabled }
							title={ option.hint }
							onClick={ () => onChange( option.value ) }
							onKeyDown={ ( e ) => onKeyDown( e, index ) }
							className={ clsx(
								'min-h-9 flex-1 rounded-[8px] px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
								checked
									? 'bg-surface text-ink shadow-raised'
									: 'text-muted hover:text-ink'
							) }
						>
							{ option.label }
						</button>
					);
				} ) }
			</div>
		</div>
	);
};
