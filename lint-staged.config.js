/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx,js}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,css,html,yml,yaml}': 'prettier --write',
};
