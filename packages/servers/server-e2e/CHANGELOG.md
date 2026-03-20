# @lowdefy/server-e2e

## 4.7.1

### Patch Changes

- d2cd70c3f: feat(server-e2e): Add LOWDEFY*E2E_SECRET*\* override support.

  Secrets can now be overridden in e2e tests using `LOWDEFY_E2E_SECRET_*` environment variables. These take precedence over `LOWDEFY_SECRET_*` values, allowing test infrastructure (e.g. MongoMemoryServer) to coexist with secret managers injected via `commandPrefix`.

- Updated dependencies [18d1c3bfa]
- Updated dependencies [fac48c10a]
  - @lowdefy/blocks-antd@4.7.1
  - @lowdefy/operators-js@4.7.1
  - @lowdefy/api@4.7.1
  - @lowdefy/blocks-basic@4.7.1
  - @lowdefy/blocks-loaders@4.7.1
  - @lowdefy/blocks-markdown@4.7.1
  - @lowdefy/client@4.7.1
  - @lowdefy/layout@4.7.1
  - @lowdefy/actions-core@4.7.1
  - @lowdefy/connection-axios-http@4.7.1
  - @lowdefy/connection-mongodb@4.7.1
  - @lowdefy/operators-nunjucks@4.7.1
  - @lowdefy/operators-uuid@4.7.1
  - @lowdefy/block-utils@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/logger@4.7.1
  - @lowdefy/node-utils@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [811f80760]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/blocks-antd@4.7.0
  - @lowdefy/blocks-basic@4.7.0
  - @lowdefy/api@4.7.0
  - @lowdefy/operators-js@4.7.0
  - @lowdefy/operators-nunjucks@4.7.0
  - @lowdefy/operators-uuid@4.7.0
  - @lowdefy/client@4.7.0
  - @lowdefy/layout@4.7.0
  - @lowdefy/actions-core@4.7.0
  - @lowdefy/blocks-loaders@4.7.0
  - @lowdefy/connection-axios-http@4.7.0
  - @lowdefy/connection-mongodb@4.7.0
  - @lowdefy/block-utils@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/blocks-markdown@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Patch Changes

- Updated dependencies [fb7910f62]
- Updated dependencies [c62468b98]
- Updated dependencies [5e03091ee]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8250d8d3e]
- Updated dependencies [bb3222a5a]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [af61715d5]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [43a5243da]
- Updated dependencies [f673e3ab3]
  - @lowdefy/blocks-antd@4.6.0
  - @lowdefy/blocks-basic@4.6.0
  - @lowdefy/client@4.6.0
  - @lowdefy/api@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/block-utils@4.6.0
  - @lowdefy/operators-js@4.6.0
  - @lowdefy/operators-nunjucks@4.6.0
  - @lowdefy/operators-uuid@4.6.0
  - @lowdefy/actions-core@4.6.0
  - @lowdefy/connection-axios-http@4.6.0
  - @lowdefy/logger@4.6.0
  - @lowdefy/layout@4.6.0
  - @lowdefy/blocks-loaders@4.6.0
  - @lowdefy/connection-mongodb@4.6.0
  - @lowdefy/blocks-markdown@4.6.0
