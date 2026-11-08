import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '../components/AppShell';
import { Providers } from './providers';
import '../styles/globals.css';

export const metadata: Metadata = {
	title: 'Backgammon',
	description: 'Backgammon and Dutch Triktrak, locally, against the AI or online.',
};

export default function RootLayout( { children }: { children: ReactNode } ) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<AppShell>{ children }</AppShell>
				</Providers>
			</body>
		</html>
	);
}
