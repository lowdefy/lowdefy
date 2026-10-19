---
'@lowdefy/plugin-posthog': minor
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'@lowdefy/client': patch
---

feat(plugin-posthog): mask click text that shows app data

The PostHog plugin now masks click text before events leave the browser. A clicked text (`$el_text`, `text` entries in `$elements_chain` and `$elements`, `$selected_content` and link targets) is kept only when the config of the page it was clicked on, the menus, the i18n messages or the antd locale spell it out. Grid and table cell values, options and menu items filled by requests, labels built from records and `Dynamic` block output are removed; button, menu, tab, column header and literal option labels stay. Element attributes other than structural ones (tag, classes, `class`, `role`, `type`, `row-index`, `col-id`, `nth-child`, `nth-of-type`) are removed, including `title`, `aria-label` and `data-*`, and `id` is kept only as a block wrapper id. Classes and `data-ph-capture-attribute-*` values are not masked, so apps must not build them from data. This applies to every event, including dead clicks and swipes, and the `lowdefy_*` properties stay, so clicks on data still record their page, block, row and column. URLs are not masked.

Masking is on by default. Set `maskDataText: false` on `PostHogInit` to send full click text, or `options.mask_all_text: true` to send none. The engine trace gains `isConfigText({ text, pageId })`, and `@lowdefy/helpers` exports `filterElementsChain`.
