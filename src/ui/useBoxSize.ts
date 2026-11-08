'use client';

import { useEffect, useState, type RefObject } from 'react';

/** The content size of an element, updated when it changes. */
export const useBoxSize = ( ref: RefObject< HTMLElement | null > ): { w: number; h: number } | null => {
	const [ size, setSize ] = useState< { w: number; h: number } | null >( null );
	useEffect( () => {
		const el = ref.current;
		if ( ! el || typeof ResizeObserver === 'undefined' ) return;
		const observer = new ResizeObserver( ( [ entry ] ) => {
			const { width, height } = entry.contentRect;
			setSize( ( old ) => ( old && old.w === width && old.h === height ? old : { w: width, h: height } ) );
		} );
		observer.observe( el );
		return () => observer.disconnect();
	}, [ ref ] );
	return size;
};
