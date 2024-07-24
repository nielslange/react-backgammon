/**
 * External dependencies
 */
import { Button } from '@ariakit/react';

/**
 * Internal dependencies
 */
import { useDispatch } from 'react-redux';
import { rollDice } from '../data/actions';

export const GameState = () => {
	const dispatch = useDispatch();

	return (
		<>
			<h2>GameState.tsx</h2>
			<Button onClick={ () => dispatch( rollDice() ) }>Restart</Button>
			<Button onClick={ () => dispatch( rollDice() ) }>Surrender</Button>
		</>
	);
};
