# @lowdefy/server-e2e

## 5.1.0

### Patch Changes

- Updated dependencies [95388a581]
- Updated dependencies [573b90369]
- Updated dependencies [be367bebd]
- Updated dependencies [b1e0c9944]
- Updated dependencies [447f8ce57]
- Updated dependencies [36a2d1bca]
- Updated dependencies [081d79634]
- Updated dependencies [f56a47d87]
- Updated dependencies [6c6aab961]
- Updated dependencies [af8ef77cb]
  - @lowdefy/blocks-antd@5.1.0
  - @lowdefy/client@5.1.0
  - @lowdefy/operators-js@5.1.0
  - @lowdefy/api@5.1.0
  - @lowdefy/layout@5.1.0
  - @lowdefy/actions-core@5.1.0
  - @lowdefy/blocks-basic@5.1.0
  - @lowdefy/blocks-loaders@5.1.0
  - @lowdefy/blocks-markdown@5.1.0
  - @lowdefy/connection-axios-http@5.1.0
  - @lowdefy/connection-mongodb@5.1.0
  - @lowdefy/operators-nunjucks@5.1.0
  - @lowdefy/operators-uuid@5.1.0
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/logger@5.1.0
  - @lowdefy/node-utils@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [52ea769811]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [29eb199c7f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [155c0b9724]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [0fe1bc38dd]
- Updated dependencies [130a569d36]
- Updated dependencies [e3e922538]
- Updated dependencies [c3b5b45ec5]
- Updated dependencies [c8f4a41063]
- Updated dependencies [fd8225b7a1]
- Updated dependencies [43528a8b9]
- Updated dependencies [905d5d406]
- Updated dependencies [c1b5ddb33a]
- Updated dependencies [f430f02dde]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [c570982e0f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/blocks-basic@5.0.0
  - @lowdefy/blocks-antd@5.0.0
  - @lowdefy/client@5.0.0
  - @lowdefy/layout@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/blocks-loaders@5.0.0
  - @lowdefy/blocks-markdown@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/actions-core@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/connection-axios-http@5.0.0
  - @lowdefy/operators-nunjucks@5.0.0
  - @lowdefy/operators-uuid@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/api@5.0.0
  - @lowdefy/connection-mongodb@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- Updated dependencies [c5ce5b972]
- Updated dependencies [9de3276dc]
  - @lowdefy/operators-js@4.7.3
  - @lowdefy/api@4.7.3
  - @lowdefy/client@4.7.3
  - @lowdefy/layout@4.7.3
  - @lowdefy/actions-core@4.7.3
  - @lowdefy/blocks-antd@4.7.3
  - @lowdefy/blocks-basic@4.7.3
  - @lowdefy/blocks-loaders@4.7.3
  - @lowdefy/blocks-markdown@4.7.3
  - @lowdefy/connection-axios-http@4.7.3
  - @lowdefy/connection-mongodb@4.7.3
  - @lowdefy/operators-nunjucks@4.7.3
  - @lowdefy/operators-uuid@4.7.3
  - @lowdefy/block-utils@4.7.3
  - @lowdefy/errors@4.7.3
  - @lowdefy/helpers@4.7.3
  - @lowdefy/logger@4.7.3
  - @lowdefy/node-utils@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/api@4.7.2
- @lowdefy/client@4.7.2
- @lowdefy/layout@4.7.2
- @lowdefy/actions-core@4.7.2
- @lowdefy/blocks-antd@4.7.2
- @lowdefy/blocks-basic@4.7.2
- @lowdefy/blocks-loaders@4.7.2
- @lowdefy/blocks-markdown@4.7.2
- @lowdefy/connection-axios-http@4.7.2
- @lowdefy/connection-mongodb@4.7.2
- @lowdefy/operators-js@4.7.2
- @lowdefy/operators-nunjucks@4.7.2
- @lowdefy/operators-uuid@4.7.2
- @lowdefy/block-utils@4.7.2
- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2
- @lowdefy/logger@4.7.2
- @lowdefy/node-utils@4.7.2

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
