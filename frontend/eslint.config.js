// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.expo/**', 'node_modules/**'],
  },
  expoConfig,
  {
    rules: {
      // Reanimated useSharedValue mutates .value by design
      'react-hooks/immutability': 'off',
    },
  },
]);
