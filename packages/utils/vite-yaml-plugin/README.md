# @lowdefy/vite-yaml-plugin

A Vite plugin that turns `.yaml` imports into modules: `import config from './page.yaml'` gives the parsed YAML as the default export. Lowdefy's tests use it through vitest:

```js
import { defineConfig } from 'vitest/config';
import yaml from '@lowdefy/vite-yaml-plugin';

export default defineConfig({
  plugins: [yaml()],
});
```

`yaml({ include })` takes a regular expression for the files to transform (default `/\.yaml$/`). `?raw` and `?url` imports are left to Vite.

It replaces `@lowdefy/jest-yaml-transform` and gives the same output.
