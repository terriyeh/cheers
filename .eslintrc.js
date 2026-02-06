module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
		project: './tsconfig.json',
		extraFileExtensions: ['.svelte'],
	},
	env: {
		browser: true,
		es2017: true,
		node: true,
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		// Allow unused vars that start with underscore
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
		],
		// Allow explicit any when necessary
		'@typescript-eslint/no-explicit-any': 'warn',
		// Enforce consistent type imports
		'@typescript-eslint/consistent-type-imports': 'warn',
		// Disable rules that conflict with TypeScript
		'no-undef': 'off',
	},
	overrides: [
		{
			// Svelte-specific configuration
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
			rules: {
				// Allow function declarations in Svelte script blocks
				'no-inner-declarations': 'off',
			},
		},
	],
	ignorePatterns: [
		'node_modules/',
		'main.js',
		'*.d.ts',
		'esbuild.config.mjs',
		'version-bump.mjs',
	],
};
