---
'@lowdefy/blocks-antd': minor
'@lowdefy/build': patch
---

feat(blocks-antd): Add Search command palette block with MiniSearch.

New `Search` display block provides a full-text search command palette (Cmd+K / Ctrl+K) using MiniSearch (~6KB) and antd Modal.

- **Pre-built index support**: Load a static JSON index via `indexUrl` for zero-config search on static sites
- **Runtime indexing**: Pass `documents` array with `fields` and `storeFields` for client-side indexing
- **Grouped results**: Results auto-grouped by configurable field with section headers
- **Keyboard navigation**: Arrow keys, Enter to select, Escape to close
- **Term highlighting**: Matched search terms highlighted in results
- **Recent searches**: localStorage-backed search history with configurable count
- **14 CSS slots**: Full style customization via `styles`/`classNames` (trigger, modal, input, results, groups, highlights)
- **Analytics-friendly events**: `onSelect` passes the result item, search `query`, and `resultCount` for click-through tracking; `onSearch` passes the search term and result count on each query change

### Docs app integration

- New search index transformer (`generateSiteAssets.js`) builds a MiniSearch index at build time from page content
- Replaces Algolia DocSearch with the self-hosted Search block — removes external CDN dependency

### Removed

- `@lowdefy/blocks-algolia` package has been removed. Use the `Search` block in `@lowdefy/blocks-antd` instead.
