---
'@lowdefy/operators-dayjs': major
'@lowdefy/blocks-antd': major
'@lowdefy/nunjucks': major
'@lowdefy/connection-google-sheets': major
'@lowdefy/build': major
---

Replace moment.js with day.js across the monorepo.

### Breaking Changes

- **`_moment` operator removed**: Use `_dayjs` instead. The new `@lowdefy/operators-dayjs` package provides the `_dayjs` operator with the same API patterns.
- **`@lowdefy/operators-moment` package removed**: Apps using `_moment` must migrate to `_dayjs`.
- **Nunjucks `date` filter**: Now uses day.js internally. Format strings are day.js compatible (mostly identical to moment).
- **Date picker blocks**: All date/time picker blocks use day.js instead of moment for value parsing and formatting.
- **Google Sheets connection**: Date serialization uses day.js internally.
- **`humanizeDuration` thresholds**: The `thresholds` parameter on `_dayjs.humanizeDuration` is silently ignored (day.js does not support it).
- **AgGrid cell renderers**: Update `__moment` to `__dayjs` in custom AG Grid cell renderer references.
