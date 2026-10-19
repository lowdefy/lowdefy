---
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(dev): Screenshot viewport and colour scheme, smaller journey results, and Back, title and segmented-control steps for journeys.

**Screenshots (`lowdefy_screenshot_page`)**

- New `width`, `height` and `colorScheme: 'light' | 'dark'` options check a phone layout or dark mode, e.g. `{ "width": 390, "colorScheme": "dark" }`. The REST route takes them as `?viewportWidth=390&viewportHeight=844&colorScheme=dark`, since `width` and `height` there already name the clip.

**Journeys (`lowdefy_run_journey`, `POST /lowdefy-docs/journey`, `lowdefy test`)**

- A final page state over 10000 characters is no longer returned whole: the result carries `stateOmitted` with its size and each top-level key's size. A new `state` option picks what comes back: an array of state paths, `true` for the whole state, or `false` for none.
- New `{ "back": true }` step presses the browser's Back button, and `{ "expect": { "title": { "equals" | "contains" } } }` checks the document title.
- Segmented controls, radio groups and checkboxes are reached through their labels, so `click` by text and `select` by value work on a `SegmentedSelector`, `RadioSelector` or `ButtonSelector` option; before, the runner found the option's hidden input and timed out.
