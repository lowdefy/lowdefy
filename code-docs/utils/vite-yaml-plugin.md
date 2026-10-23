# @lowdefy/vite-yaml-plugin

Vite plugin for YAML file imports in vitest. It replaced `@lowdefy/jest-yaml-transform` when the
repository moved from jest to vitest, and gives the same module body. The package is private:
only this repository's tests use it.

## Overview

Lets tests import YAML files directly:

```javascript
import schema from './schema.yaml';
import examples from './examples.yaml';
```

## Usage

Add it to the package's `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';
import yaml from '@lowdefy/vite-yaml-plugin';

export default defineConfig({
  plugins: [yaml()],
  test: {
    environment: 'jsdom',
  },
});
```

`@lowdefy/client`, `@lowdefy/layout` and `@lowdefy/plugin-aws` use it.

## How It Works

1. Vite meets a `.yaml` import (`?raw` and `?url` imports are left to Vite).
2. `yamlToJs` parses the file with `yaml` and prints it as tab-indented JSON.
3. The module is `export default <that JSON>;`.

## Options

`yaml({ include })` takes a regular expression for the files to transform. The default is
`/\.yaml$/`, so `.yml` files are not transformed unless `include` names them.

## Key Files

| File                | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `src/index.js`      | The Vite plugin                                         |
| `src/yamlToJs.js`   | YAML source to module body                              |
| `src/index.test.js` | Checks the body against every client and layout fixture |
