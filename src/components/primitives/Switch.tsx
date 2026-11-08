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
	const buttonId = id ?? `${ autoId }-switch`;
	const labelId = `${ buttonId }-label`;
	return (
		<span className={ clsx( 'inline-flex items-center gap-2', className ) }>
			<button
				type="button"
				role="switch"
				id={ buttonId }
				aria-checked={ checked }
				aria-labelledby={ labelId }
				disabled={ disabled }
				onClick={ () => onChange( ! checked ) }
				className={ clsx(
					'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:border-dashed',
					checked ? 'border-focus bg-accent' : 'border-control bg-surface'
				) }
			>
				<span
					aria-hidden="true"
					className={ clsx(
						'inline-block size-3.5 rounded-full transition-transform',
						checked ? 'translate-x-[18px] bg-accent-ink' : 'translate-x-[3px] bg-control'
					) }
				/>
			</button>
			{ /* A <label> for the button: clicking the text toggles the switch. */ }
			<label
				id={ labelId }
				htmlFor={ buttonId }
				className={ clsx( 'text-sm', disabled ? 'cursor-not-allowed text-muted' : 'cursor-pointer' ) }
			>
				{ label }
			</label>
		</span>
	);
};
