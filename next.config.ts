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
	// Phones on the local network may open the dev server, for example
	// DEV_LAN_HOSTS=192.168.1.215 pnpm dev (comma-separated hosts).
	allowedDevOrigins: process.env.DEV_LAN_HOSTS?.split( ',' ).filter( Boolean ) ?? [],
};

export default nextConfig;
