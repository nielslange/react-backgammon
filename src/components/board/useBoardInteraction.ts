'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useDispatch, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '../../data/store';
import { setPreview } from '../../data/uiSlice';
import { laneAt, toViewBox, type Point } from '../../ui/boardGeometry';
import { onCheckerClick, onDrop, onTargetClick, optionsForChecker } from '../../ui/moveInput';

/** Pointer travel in screen pixels before a press counts as a drag. */
const DRAG_PX = 8;

type Drag = { id: number; x: number; y: number };
type Listeners = {
	move: ( e: PointerEvent ) => void;
	up: ( e: PointerEvent ) => void;
	cancel: ( e: PointerEvent ) => void;
};

/**
 * Click and drag handling for the board. Clicks follow the selected mode
 * (beginner preview or advanced die-first); dragging an own checker with
 * legal moves lights up its landing points and drops onto one of them.
 * Only the pointer that started a drag can move, drop or cancel it.
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
		window.removeEventListener( 'pointercancel', listeners.current.cancel );
		listeners.current = null;
	};

	useEffect( () => detach, [] );

	const toPoint = ( event: { clientX: number; clientY: number } ): Point | null => {
		const svg = svgRef.current;
		return svg ? toViewBox( event.clientX, event.clientY, svg.getBoundingClientRect() ) : null;
	};

	const swallowNextClick = () => {
		suppressClick.current = true;
		setTimeout( () => {
			suppressClick.current = false;
		}, 0 );
	};

	const onCheckerPointerDown = ( id: number, event: ReactPointerEvent< SVGGElement > ) => {
		if ( event.button !== 0 || listeners.current ) return;
		const options = optionsForChecker( store.getState(), id );
		if ( options.length === 0 ) return;
		const pointerId = event.pointerId;
		const startX = event.clientX;
		const startY = event.clientY;
		let moved = false;

		const move = ( e: PointerEvent ) => {
			if ( e.pointerId !== pointerId ) return;
			if ( ! moved && Math.hypot( e.clientX - startX, e.clientY - startY ) > DRAG_PX ) {
				moved = true;
				dispatch( setPreview( { checkerId: id, options } ) );
			}
			const p = toPoint( e );
			if ( moved && p ) setDrag( { id, x: p.x, y: p.y } );
		};

		const up = ( e: PointerEvent ) => {
			if ( e.pointerId !== pointerId ) return;
			detach();
			setDrag( null );
			if ( ! moved ) return;
			// The release also fires a click; it must not count as one.
			swallowNextClick();
			const p = toPoint( e );
			const lane = p ? laneAt( p ) : null;
			if ( lane === null || ! onDrop( dispatch, store.getState(), id, lane ) ) {
				dispatch( setPreview( null ) );
			}
		};

		// The system took the pointer (scroll, multi-touch, palm rejection):
		// put the checker back and forget the drag.
		const cancel = ( e: PointerEvent ) => {
			if ( e.pointerId !== pointerId ) return;
			detach();
			setDrag( null );
			if ( moved ) {
				swallowNextClick();
				dispatch( setPreview( null ) );
			}
		};

		listeners.current = { move, up, cancel };
		window.addEventListener( 'pointermove', move );
		window.addEventListener( 'pointerup', up );
		window.addEventListener( 'pointercancel', cancel );
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
