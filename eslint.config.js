import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
	{ ignores: [ 'dist/**', 'node_modules/**' ] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	reactHooks.configs.flat[ 'recommended-latest' ],
	{
		files: [ '**/*.{ts,tsx,mts}' ],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		plugins: { 'react-refresh': reactRefresh },
		rules: {
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		files: [ '**/*.cjs' ],
		languageOptions: {
			sourceType: 'commonjs',
			globals: { ...globals.node },
		},
		rules: { '@typescript-eslint/no-require-imports': 'off' },
	},
	{
		files: [ 'src/tests/**/*.ts' ],
		languageOptions: { globals: { ...globals.vitest } },
	}
);
