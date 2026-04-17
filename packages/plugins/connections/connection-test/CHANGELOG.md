# @lowdefy/connection-test

## 5.0.0

### Major Changes

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

### Patch Changes

- @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/errors@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/errors@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/errors@4.7.1

## 4.7.0

### Patch Changes

- @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- f673e3ab3: feat(connection-test): Add test connection plugin for debugging requests and errors

  New `@lowdefy/connection-test` plugin with `TestLog` and `TestError` request types for testing the request pipeline, error handling, and logging output during development.

### Patch Changes

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [f673e3ab3]
  - @lowdefy/errors@4.6.0
