import { defineConfig } from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...next,
  {
    rules: {
      // Civic media is already resized on upload and served directly with its own cache policy.
      '@next/next/no-img-element': 'off',
    },
  },
]);
