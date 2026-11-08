import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
	// Pin the workspace root so Turbopack does not pick a lockfile from a
	// parent directory.
	turbopack: {
		root: path.resolve( import.meta.dirname ),
	},
	devIndicators: {
		position: 'bottom-right',
	},
};

export default nextConfig;
