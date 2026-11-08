import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppShell } from '../components/AppShell';
import { Providers } from './providers';
import '../styles/globals.css';

const inter = Inter( { subsets: [ 'latin' ], variable: '--font-inter' } );
const fraunces = Fraunces( { subsets: [ 'latin' ], variable: '--font-fraunces', weight: [ '600' ] } );

export const metadata: Metadata = {
	title: 'Backgammon',
	description: 'Backgammon and Dutch Triktrak, locally, against the AI or online.',
};

/**
 * Runs before the first paint so a saved light or dark choice applies
 * without a flash. AppShell keeps it in sync afterwards.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem('backgammon-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout( { children }: { children: ReactNode } ) {
	return (
		<html
			lang="en"
			className={ `${ inter.variable } ${ fraunces.variable }` }
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={ { __html: THEME_SCRIPT } } />
			</head>
			<body>
				<Providers>
					<AppShell>{ children }</AppShell>
				</Providers>
			</body>
		</html>
	);
}
