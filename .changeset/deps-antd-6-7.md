---
'@lowdefy/build': patch
'@lowdefy/client': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-antd-x': patch
---

fix(deps): Update antd to 6.7.0

antd 6.7.0 brings keyboard and screen reader improvements to DatePicker, Select, Pagination, Collapse and Table row selection, and fixes Tooltip text shifting after it opens, Statistic showing exponential notation for very small or large numbers, and Dropdown and Tree scrolling unexpectedly on focus. `@rc-component/motion` 1.3.3 and `react-virtuoso` 4.18.21 in `@lowdefy/blocks-antd` are bug-fix releases. An app theme that sets the Alert component token `borderRadius` to round the alert box should set `containerBorderRadius` instead, which antd 6.7 uses for the container.

The date and time pickers' footer markup changed: the Today/Now and OK controls are now plain buttons carrying the `ant-picker-now` and `ant-picker-ok` classes, in a `div.ant-picker-ranges` instead of `li` items in a `ul`. The DateTimeSelector e2e helper in `@lowdefy/blocks-antd/e2e` now clicks `.ant-picker-ok` directly. App styles or e2e tests that target `.ant-picker-ok button`, `.ant-picker-now-btn` or `.ant-picker-ranges li` need the same change.
