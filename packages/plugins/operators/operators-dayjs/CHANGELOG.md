# @lowdefy/operators-dayjs

## 5.1.0

### Patch Changes

- @lowdefy/operators@5.1.0

## 5.0.0

### Major Changes

- 155c0b9724: Replace moment.js with day.js across the monorepo.

  ### Breaking Changes

  - **`_moment` operator removed**: Use `_dayjs` instead. The new `@lowdefy/operators-dayjs` package provides the `_dayjs` operator with the same API patterns.
  - **`@lowdefy/operators-moment` package removed**: Apps using `_moment` must migrate to `_dayjs`.
  - **Nunjucks `date` filter**: Now uses day.js internally. Format strings are day.js compatible (mostly identical to moment).
  - **Date picker blocks**: All date/time picker blocks use day.js instead of moment for value parsing and formatting.
  - **Google Sheets connection**: Date serialization uses day.js internally.
  - **`humanizeDuration` thresholds**: The `thresholds` parameter on `_dayjs.humanizeDuration` is silently ignored (day.js does not support it).
  - **AgGrid cell renderers**: Update `__moment` to `__dayjs` in custom AG Grid cell renderer references.
  - **Date selector UTC handling**: Antd v6 bundles its own dayjs without the UTC plugin. Date selector blocks wrap antd's dayjs instances with the extended dayjs before calling `.utc()` — this is handled internally and requires no user action.

### Patch Changes

- @lowdefy/operators@5.0.0
