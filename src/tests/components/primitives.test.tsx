import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from '../../components/primitives/Button';
import { Dialog } from '../../components/primitives/Dialog';
import { Segmented } from '../../components/primitives/Segmented';
import { Switch } from '../../components/primitives/Switch';

describe( 'Button', () => {
	it( 'is a button that activates with Enter and Space', async () => {
		const onClick = vi.fn();
		render( <Button onClick={ onClick }>Start</Button> );
		const button = screen.getByRole( 'button', { name: 'Start' } );
		expect( button ).toHaveAttribute( 'type', 'button' );
		button.focus();
		await userEvent.keyboard( '{Enter}' );
		await userEvent.keyboard( ' ' );
		expect( onClick ).toHaveBeenCalledTimes( 2 );
	} );
	it( 'does not fire when disabled', async () => {
		const onClick = vi.fn();
		render( <Button onClick={ onClick } disabled>Start</Button> );
		await userEvent.click( screen.getByRole( 'button' ) );
		expect( onClick ).not.toHaveBeenCalled();
	} );
} );

describe( 'Switch', () => {
	const Harness = () => {
		const [ on, setOn ] = useState( false );
		return <Switch label="Advanced mode" checked={ on } onChange={ setOn } />;
	};
	it( 'exposes role switch with aria-checked and toggles by keyboard', async () => {
		render( <Harness /> );
		const sw = screen.getByRole( 'switch', { name: 'Advanced mode' } );
		expect( sw ).toHaveAttribute( 'aria-checked', 'false' );
		sw.focus();
		await userEvent.keyboard( ' ' );
		expect( sw ).toHaveAttribute( 'aria-checked', 'true' );
		await userEvent.click( sw );
		expect( sw ).toHaveAttribute( 'aria-checked', 'false' );
	} );
} );

describe( 'Segmented', () => {
	const Harness = ( { onChange }: { onChange?: ( v: string ) => void } ) => {
		const [ value, setValue ] = useState( 'easy' );
		return (
			<Segmented
				label="Difficulty"
				value={ value }
				onChange={ ( v ) => {
					setValue( v );
					onChange?.( v );
				} }
				options={ [
					{ value: 'easy', label: 'Easy' },
					{ value: 'medium', label: 'Medium' },
					{ value: 'hard', label: 'Hard', disabled: true },
				] }
			/>
		);
	};
	it( 'is a radiogroup with one checked radio', () => {
		render( <Harness /> );
		expect( screen.getByRole( 'radiogroup', { name: 'Difficulty' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Easy' } ) ).toHaveAttribute( 'aria-checked', 'true' );
		expect( screen.getByRole( 'radio', { name: 'Medium' } ) ).toHaveAttribute( 'aria-checked', 'false' );
	} );
	it( 'moves the selection with arrow keys and skips disabled options', async () => {
		const onChange = vi.fn();
		render( <Harness onChange={ onChange } /> );
		screen.getByRole( 'radio', { name: 'Easy' } ).focus();
		await userEvent.keyboard( '{ArrowRight}' );
		expect( onChange ).toHaveBeenLastCalledWith( 'medium' );
		expect( screen.getByRole( 'radio', { name: 'Medium' } ) ).toHaveFocus();
		await userEvent.keyboard( '{ArrowRight}' );
		expect( onChange ).toHaveBeenLastCalledWith( 'easy' );
	} );
	it( 'only the checked radio is in the tab order', () => {
		render( <Harness /> );
		expect( screen.getByRole( 'radio', { name: 'Easy' } ) ).toHaveAttribute( 'tabindex', '0' );
		expect( screen.getByRole( 'radio', { name: 'Medium' } ) ).toHaveAttribute( 'tabindex', '-1' );
	} );
} );

describe( 'Dialog', () => {
	it( 'renders a labelled dialog only while open and closes on Escape', async () => {
		const onClose = vi.fn();
		const { rerender } = render(
			<Dialog open={ false } title="Game over" onClose={ onClose }>
				Blue wins
			</Dialog>
		);
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		rerender(
			<Dialog open title="Game over" onClose={ onClose }>
				Blue wins
			</Dialog>
		);
		const dialog = screen.getByRole( 'dialog', { name: 'Game over' } );
		expect( dialog ).toHaveAttribute( 'aria-modal', 'true' );
		expect( dialog ).toHaveTextContent( 'Blue wins' );
		await userEvent.keyboard( '{Escape}' );
		expect( onClose ).toHaveBeenCalled();
	} );
	it( 'moves focus into the dialog when it opens', () => {
		render(
			<Dialog open title="Double offered" onClose={ () => {} }>
				<button type="button">Take</button>
			</Dialog>
		);
		expect( screen.getByRole( 'button', { name: 'Take' } ) ).toHaveFocus();
	} );
} );
