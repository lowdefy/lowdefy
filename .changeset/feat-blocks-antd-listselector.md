---
'@lowdefy/blocks-antd': minor
'@lowdefy/helpers': patch
---

feat(blocks-antd): Add `ListSelector` input block.

Data-driven vertical list that doubles as a single-select input. Each item is rendered into a headerless antd `Card` whose body comes from a Nunjucks template against the row. Clicking a card sets the block value (the whole item, or the `valueKey` field when set) and highlights the selected card with a `colorPrimary` ring that follows the app theme. Clicking the selected card again clears the value (`allowDeselect`, on by default). Set `selectable: false` to turn selection off and render a read-only card list. Use `valueKey` to store a single field (e.g. `id`) as the value, and `primaryKey` (defaults to `valueKey`) to match a `SetState`-controlled value back to a card for highlighting.

Backed by `react-virtuoso` so thousands of variable-height cards render smoothly with only the visible window in the DOM, and rows are `React.memo`'d via a stable `methodsRef` so unrelated parent re-renders don't bust the cache. Selection state lives in the block value, so the selected card stays correct as rows scroll in and out of the virtual window.

Properties: `data`, `html` (Nunjucks), `valueKey`, `primaryKey`, `selectable`, `allowDeselect`, `bordered`, `hoverable`, `size`, `gap`, `height`, `overscan`, `noData`, `theme`, and an optional `search` object (`placeholder`, `fields`, `caseSensitive`, `debounce`, `sticky`, `allowClear`, `minLength`, `noResultsText`). Search defaults to matching every field path via `JSON.stringify`; supply `fields: ['user.name', 'email']` to restrict. Filtering preserves the original `index` in the template context and event payloads. Built-in loading skeleton renders when `loading` is truthy. A text-only no-results placeholder appears when the filter matches zero items, and a `noData` placeholder renders in place of the list when the `data` array is empty.

Events: `onChange` (`{ value, index, item }`, fires on selection change when `selectable` is true), `onClick` (`{ index, item }`), and `onSearch` (`{ value, resultCount }`, fires on debounced query change when `search` is set).

`@lowdefy/helpers`: renames the built-in i18n message keys `blocks.cardList.search.placeholder` / `blocks.cardList.search.noResults` to `blocks.listSelector.search.*` to match the block, and adds `blocks.listSelector.noData` ("No data").
