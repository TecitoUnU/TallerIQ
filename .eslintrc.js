/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
};
