import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig( {
	plugins: [ react() ],
	test: {
		environment: 'jsdom',
		globals: true,
		include: [ 'src/**/*.test.{ts,tsx}' ],
		setupFiles: [ 'src/tests/setup.ts' ],
		coverage: {
			provider: 'v8',
			reporter: [ 'text' ],
		},
		reporters: [ 'default' ],
	},
} );
