import { defineConfig, devices } from '@playwright/test';

export default defineConfig( {
	testDir: 'e2e',
	fullyParallel: false,
	retries: 0,
	reporter: 'list',
	use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
	projects: [
		{ name: 'desktop', use: { ...devices[ 'Desktop Chrome' ], viewport: { width: 1400, height: 900 } } },
		{ name: 'phone', use: { ...devices[ 'Pixel 7' ], viewport: { width: 390, height: 844 } } },
	],
	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 120_000,
	},
} );
