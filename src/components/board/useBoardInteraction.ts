'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useDispatch, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '../../data/store';
import { setPreview } from '../../data/uiSlice';
import { laneAt, toViewBox, type Point } from '../../ui/boardGeometry';
import { onCheckerClick, onDrop, onTargetClick, optionsForChecker } from '../../ui/moveInput';

/** Pointer travel (viewBox units) before a press counts as a drag. */
const DRAG_THRESHOLD = 8;

type Drag = { id: number; x: number; y: number };
type Listeners = { move: ( e: PointerEvent ) => void; up: ( e: PointerEvent ) => void };

/**
 * Click and drag handling for the board. Clicks follow the selected mode
 * (beginner preview or advanced die-first); dragging an own checker with
 * legal moves lights up its landing points and drops onto one of them.
 */
export const useBoardInteraction = () => {
	const dispatch = useDispatch< AppDispatch >();
	const store = useStore< RootState >();
	const svgRef = useRef< SVGSVGElement >( null );
	const listeners = useRef< Listeners | null >( null );
	const suppressClick = useRef( false );
	const [ drag, setDrag ] = useState< Drag | null >( null );

	const detach = () => {
		if ( ! listeners.current ) return;
		window.removeEventListener( 'pointermove', listeners.current.move );
		window.removeEventListener( 'pointerup', listeners.current.up );
		listeners.current = null;
	};

	useEffect( () => detach, [] );

	const toPoint = ( event: { clientX: number; clientY: number } ): Point | null => {
		const svg = svgRef.current;
		return svg ? toViewBox( event.clientX, event.clientY, svg.getBoundingClientRect() ) : null;
	};

	const onCheckerPointerDown = ( id: number, event: ReactPointerEvent< SVGGElement > ) => {
		if ( event.button !== 0 ) return;
		const options = optionsForChecker( store.getState(), id );
		const start = toPoint( event );
		if ( options.length === 0 || ! start ) return;
		detach();
		let moved = false;

		const move = ( e: PointerEvent ) => {
			const p = toPoint( e );
			if ( ! p ) return;
			if ( ! moved && Math.hypot( p.x - start.x, p.y - start.y ) > DRAG_THRESHOLD ) {
				moved = true;
				dispatch( setPreview( { checkerId: id, options } ) );
			}
			if ( moved ) setDrag( { id, x: p.x, y: p.y } );
		};

		const up = ( e: PointerEvent ) => {
			detach();
			setDrag( null );
			if ( ! moved ) return;
			// The release also fires a click; it must not count as one.
			suppressClick.current = true;
			setTimeout( () => {
				suppressClick.current = false;
			}, 0 );
			const p = toPoint( e );
			const lane = p ? laneAt( p ) : null;
			if ( lane !== null ) onDrop( dispatch, store.getState(), id, lane );
		};

		listeners.current = { move, up };
		window.addEventListener( 'pointermove', move );
		window.addEventListener( 'pointerup', up );
	};

	return {
		svgRef,
		drag,
		onCheckerPointerDown,
		onCheckerClick: ( id: number ) => {
			if ( ! suppressClick.current ) onCheckerClick( dispatch, store.getState(), id );
		},
		onLaneClick: ( lane: number ) => {
			if ( ! suppressClick.current ) onTargetClick( dispatch, store.getState(), lane );
		},
	};
};
