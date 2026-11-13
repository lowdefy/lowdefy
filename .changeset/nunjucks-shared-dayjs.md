---
'@lowdefy/nunjucks': patch
---

fix(nunjucks): Use the app's dayjs in the `date` filter, so it follows the app locale

`@lowdefy/nunjucks` bundled its own copy of dayjs and its `utc`, `relativeTime` and `customParseFormat` plugins, because its webpack config still marked `moment` (not `dayjs`) as external after the filter moved to dayjs. The client sets the active locale on the shared dayjs, so the `date` filter ignored it: `{{ d | date('MMMM') }}` printed `August` in a French app. dayjs is now external, so the filter formats with the app's dayjs and locale, and the bundle is about 14 KB smaller. The build drops the unmaintained `clean-webpack-plugin` for webpack's `output.clean`.
