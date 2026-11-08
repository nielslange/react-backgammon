'use client';

import { clsx } from 'clsx';
import { useId } from 'react';

type Props = {
	label: string;
	checked: boolean;
	onChange: ( checked: boolean ) => void;
	disabled?: boolean;
	id?: string;
	className?: string;
};

/** An on/off switch: a button with role="switch" and a visible label. */
export const Switch = ( { label, checked, onChange, disabled, id, className }: Props ) => {
	const autoId = useId();
	const labelId = `${ id ?? autoId }-label`;
	return (
		<span className={ clsx( 'inline-flex items-center gap-2', className ) }>
			<button
				type="button"
				role="switch"
				id={ id }
				aria-checked={ checked }
				aria-labelledby={ labelId }
				disabled={ disabled }
				onClick={ () => onChange( ! checked ) }
				className={ clsx(
					'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-line transition-colors disabled:opacity-45',
					checked ? 'bg-accent' : 'bg-canvas'
				) }
			>
				<span
					aria-hidden="true"
					className={ clsx(
						'inline-block size-4 rounded-full bg-surface shadow transition-transform',
						checked ? 'translate-x-5' : 'translate-x-1'
					) }
				/>
			</button>
			<span id={ labelId } className="text-sm">
				{ label }
			</span>
		</span>
	);
};
