---
'@lowdefy/block-utils': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-diff': patch
'@lowdefy/blocks-native': patch
'@lowdefy/blocks-table': patch
'@lowdefy/client': patch
'@lowdefy/connection-google-sheets': patch
'@lowdefy/nunjucks': patch
'@lowdefy/operators-dayjs': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'@lowdefy/shell': patch
---

fix(deps): Update dayjs to 1.11.23

dayjs 1.11.23 fixes the timezone plugin computing a `.tz()` offset from the host's daylight saving time instead of the target zone's, and throwing a RangeError for invalid dates. Format strings keep year tokens dayjs does not support as literal text.
