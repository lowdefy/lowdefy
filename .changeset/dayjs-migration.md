---
'@lowdefy/operators-dayjs': major
'@lowdefy/blocks-antd': major
'@lowdefy/nunjucks': major
'@lowdefy/connection-google-sheets': major
'@lowdefy/build': major
'@lowdefy/operators': major
---

Replace moment.js with day.js across the monorepo.

### Breaking Changes

- **`_moment` operator removed**: Use `_dayjs` instead. The new `@lowdefy/operators-dayjs` package provides the `_dayjs` operator with the same API patterns.
- **`@lowdefy/operators-moment` package removed**: Deleted from the monorepo. Apps using `_moment` must migrate to `_dayjs`.
- **Nunjucks `date` filter**: Now uses day.js internally. Format strings are day.js compatible (mostly identical to moment, but edge cases like `dddd` locale-dependent formatting may differ).
- **Date picker blocks**: All antd date/time picker blocks use day.js instead of moment for value parsing and formatting.
- **Google Sheets connection**: Date serialization uses day.js internally.
- **`humanizeDuration` thresholds ignored**: The `thresholds` parameter on `_dayjs.humanizeDuration` is silently ignored (day.js relative time plugin does not support it).
- **Locale normalization**: Locale names are auto-normalized (`en-US` → `en`, `zh-CN` → `zh-cn`). 22 common locales are bundled.
- **AgGrid cell renderers**: Update `__moment` → `__dayjs` in custom AG Grid cell renderer references.
