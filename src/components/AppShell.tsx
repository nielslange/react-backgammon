'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../data/store';
import { setTheme, type Theme } from '../data/uiSlice';

const NEXT_THEME: Record< Theme, Theme > = {
	system: 'light',
	light: 'dark',
	dark: 'system',
};

const THEME_LABEL: Record< Theme, string > = {
	system: 'Theme: system',
	light: 'Theme: light',
	dark: 'Theme: dark',
};

const STORAGE_KEY = 'backgammon-theme';

const ThemeIcon = ( { theme }: { theme: Theme } ) => (
	<svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		className="size-5"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
	>
		{ theme === 'dark' && (
			<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
		) }
		{ theme === 'light' && (
			<>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
			</>
		) }
		{ theme === 'system' && (
			<>
				<rect x="3" y="4" width="18" height="13" rx="2" />
				<path d="M8 21h8M12 17v4" />
			</>
		) }
	</svg>
);

/** Page frame: header with the brand and the theme toggle, then content. */
export const AppShell = ( { children }: { children: ReactNode } ) => {
	const dispatch = useDispatch< AppDispatch >();
	const theme = useSelector( ( root: RootState ) => root.ui.theme );
	const pathname = usePathname();

	// Restore the remembered theme once.
	useEffect( () => {
		try {
			const saved = localStorage.getItem( STORAGE_KEY ) as Theme | null;
			if ( saved === 'light' || saved === 'dark' )
				dispatch( setTheme( saved ) );
		} catch {
			// storage blocked: keep the system theme
		}
	}, [ dispatch ] );

	useEffect( () => {
		const root = document.documentElement;
		if ( theme === 'system' ) root.removeAttribute( 'data-theme' );
		else root.setAttribute( 'data-theme', theme );
		try {
			localStorage.setItem( STORAGE_KEY, theme );
		} catch {
			// storage blocked: the choice lasts for this visit only
		}
	}, [ theme ] );

	return (
		<div className="min-h-dvh">
			<header className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
				<Link
					href="/"
					className="font-display text-xl font-semibold tracking-tight"
				>
					Backgammon
				</Link>
				<div className="flex items-center gap-1">
					{ pathname !== '/' && (
						<Link
							href="/"
							className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-medium hover:bg-surface sm:min-h-9"
						>
							New game
						</Link>
					) }
					<button
						type="button"
						aria-label={ THEME_LABEL[ theme ] }
						title={ THEME_LABEL[ theme ] }
						onClick={ () =>
							dispatch( setTheme( NEXT_THEME[ theme ] ) )
						}
						className="inline-flex size-11 items-center justify-center rounded-control text-muted hover:bg-surface hover:text-ink sm:size-9"
					>
						<ThemeIcon theme={ theme } />
					</button>
				</div>
			</header>
			<main className="mx-auto max-w-[1200px] px-4 pb-10">
				{ children }
			</main>
		</div>
	);
};
