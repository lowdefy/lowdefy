---
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(dev): `lowdefy_screenshot_page` can capture an open dropdown, a date picker's calendar or a modal, and a page opened at a query string.

- New `steps` option runs interactions after the page settles and before the capture, addressed by block id — the same steps as `lowdefy_run_journey`. A new `{ "open": "blockId" }` step opens the popup of any input (Selector, MultipleSelector, AutoComplete, DateSelector and the other pickers, Cascader, TreeSelector) and waits for it to show. Popups are drawn at the end of the page, so `fullPage` and `clip` captures include them. If a step fails, the screenshot is still returned, showing where it stopped, together with the failure.
- New `urlQuery` option opens the page with query params, for pages that read `_url_query`.
- `open` is also a journey step for `lowdefy_run_journey` and `lowdefy test`.
