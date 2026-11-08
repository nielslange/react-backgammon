'use client';

import { useSyncExternalStore } from 'react';

/** Phones held upright: the board turns into long columns. */
export const PHONE_PORTRAIT = '(max-width: 767px) and (orientation: portrait)';

/** Phones held sideways: the board takes the height, controls go beside it. */
export const PHONE_LANDSCAPE = '(max-height: 500px) and (orientation: landscape)';

/**
 * Whether a media query matches, kept up to date. Null while rendering on
 * the server and during hydration, when the screen is not known yet.
 */
export const useMediaQuery = ( query: string ): boolean | null =>
	useSyncExternalStore(
		( onChange ) => {
			if ( typeof matchMedia === 'undefined' ) return () => {};
			const list = matchMedia( query );
			list.addEventListener( 'change', onChange );
			return () => list.removeEventListener( 'change', onChange );
		},
		() => typeof matchMedia !== 'undefined' && matchMedia( query ).matches,
		() => null
	);
