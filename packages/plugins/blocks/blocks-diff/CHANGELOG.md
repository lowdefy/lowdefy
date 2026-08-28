# Change Log

## 5.5.1

### Patch Changes

- @lowdefy/block-utils@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/block-utils@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/block-utils@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/block-utils@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/block-utils@5.2.0
- @lowdefy/helpers@5.2.0

## 5.1.0

### Minor Changes

- b1e0c9944: feat(blocks-diff): New package. DataDiff extracted from blocks-antd and split
  into `DiffList`, `DiffSideBySide`, `DiffTimeline`, and `DiffGit` blocks.

  BREAKING: The `DataDiff` block has been removed from `@lowdefy/blocks-antd`.
  Migrate to the per-mode blocks in `@lowdefy/blocks-diff`:

  - `mode: list` → `Diff.DiffList`
  - `mode: sideBySide` → `Diff.DiffSideBySide`
  - `mode: timeline` → `Diff.DiffTimeline`
  - `mode: gitDiff` → `Diff.DiffGit`

  The `diff`, `yaml`, `pluralize`, and `microdiff` dependencies have been moved
  from `@lowdefy/blocks-antd` to `@lowdefy/blocks-diff` along with the block.

### Patch Changes

- @lowdefy/block-utils@5.1.0
- @lowdefy/helpers@5.1.0
