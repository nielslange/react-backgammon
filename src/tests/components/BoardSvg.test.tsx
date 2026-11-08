import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardSvg } from '../../components/board/BoardSvg';
import { backgammon } from '../../engine/backgammon';
import { P1, P2, pos } from '../engine/fixtures';

const noop = () => {};

const renderBoard = ( props: Partial< Parameters< typeof BoardSvg >[ 0 ] > = {} ) =>
	render(
		<BoardSvg
			checkers={ backgammon.initialCheckers() }
			highlights={ [] }
			selected={ null }
			onCheckerClick={ noop }
			onLaneClick={ noop }
			{ ...props }
		/>
	);

describe( 'BoardSvg', () => {
	it( 'renders an accessible board with 24 points and 30 checkers for the start position', () => {
		const { container } = renderBoard();
		expect( screen.getByRole( 'img', { name: /backgammon board/i } ) ).toBeInTheDocument();
		expect( container.querySelectorAll( '[data-point]' ) ).toHaveLength( 24 );
		expect( container.querySelectorAll( '[data-checker]' ) ).toHaveLength( 30 );
	} );

	it( 'describes each point for screen readers', () => {
		const { container } = renderBoard();
		expect( container.querySelector( '[data-point="24"]' ) ).toHaveAttribute(
			'aria-label',
			'Point 24, 2 light checkers'
		);
		expect( container.querySelector( '[data-point="7"]' ) ).toHaveAttribute(
			'aria-label',
			'Point 7, empty'
		);
	} );

	it( 'shows a count on stacks taller than five', () => {
		const checkers = pos( [
			{ player: P1, lane: 6, count: 6 },
			{ player: P1, lane: 25, count: 9 },
			{ player: P2, lane: 19, count: 3 },
			{ player: P2, lane: 0, count: 12 },
		] );
		const { container } = renderBoard( { checkers } );
		const counts = container.querySelectorAll( '[data-count]' );
		expect( counts ).toHaveLength( 1 );
		expect( counts[ 0 ] ).toHaveTextContent( '6' );
	} );

	it( 'draws bar checkers on the bar and borne-off checkers in the trays', () => {
		const checkers = pos( [
			{ player: P1, lane: 0, count: 1 },
			{ player: P1, lane: 25, count: 14 },
			{ player: P2, lane: 25, count: 2 },
			{ player: P2, lane: 0, count: 13 },
		] );
		const { container } = renderBoard( { checkers } );
		expect( container.querySelectorAll( '[data-place="bar"]' ) ).toHaveLength( 3 );
		expect( container.querySelectorAll( '[data-place="off"]' ) ).toHaveLength( 27 );
	} );

	it( 'marks highlighted lanes as targets and reports clicks on them', async () => {
		const onLaneClick = vi.fn();
		const { container } = renderBoard( { highlights: [ 8, 25 ], onLaneClick } );
		const target = container.querySelector( '[data-target="8"]' )!;
		expect( target ).toBeInTheDocument();
		expect( container.querySelector( '[data-target="25"]' ) ).toBeInTheDocument();
		expect( container.querySelector( '[data-target="9"]' ) ).toBeNull();
		await userEvent.click( target );
		expect( onLaneClick ).toHaveBeenCalledWith( 8 );
	} );

	it( 'reports checker clicks with the id and marks the selected checker', async () => {
		const onCheckerClick = vi.fn();
		const { container } = renderBoard( { selected: 1, onCheckerClick } );
		const checker = container.querySelector( '[data-checker="1"]' )!;
		expect( checker ).toHaveAttribute( 'data-selected', 'true' );
		await userEvent.click( checker );
		expect( onCheckerClick ).toHaveBeenCalledWith( 1 );
	} );
} );
