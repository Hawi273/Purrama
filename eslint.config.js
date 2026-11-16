import js from '@eslint/js';
import globals from 'globals';

export default [
  // .claude/ holds gstack's generated team-mode hook; it is not part of the app.
  { ignores: ['design/**', 'node_modules/**', '.wrangler/**', '.gstack/**', 'worker/.wrangler/**', '.claude/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'config.js'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-properties': ['error',
        { property: 'innerHTML', message: 'Build DOM with textContent; TMDB text is untrusted.' },
        { property: 'outerHTML', message: 'Build DOM with textContent; TMDB text is untrusted.' }],
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
        message: 'Build DOM with textContent; TMDB text is untrusted.',
      }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['worker/**/*.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ['scripts/**/*.mjs', 'test/**/*.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
];
