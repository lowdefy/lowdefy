---
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/client-native': minor
'@lowdefy/engine': minor
'@lowdefy/operators': patch
'@lowdefy/shell': minor
---

feat(client-native): iOS Screen headers, tab bar icons and per-screen page state

- `Screen` takes `largeTitle` (an iOS large title that collapses as the page scrolls), `headerSearch` (a native search bar with `placeholder`, `autoFocus`, `debounce` and `hideWhenScrolling`, firing `onSearch` and `onSearchChange` with `_event: value`) and `headerActions` (`[{ id, icon, sfSymbol, title, placement, event, disabled }]`, compact icon buttons that iOS draws as native SF Symbol bar buttons, firing `onHeaderAction` with `_event: id` or their own `event`).
- `Screen` events `onRefresh` (pull-to-refresh, refreshing until the actions finish) and `onFocus` (each time the screen is shown: first show after onMount, a tab switch, back navigation).
- The `headerLeft` and `headerRight` slots draw their blocks at their natural size, so a header button is no longer a full-width capsule that truncates the title.
- Two screens of one page in a stack keep their own page state, keyed by route instance, and each reads `_url_query` and `_location` from its own route, not the focused one. A tab's page opened by a link keeps its query.
- `mobile.menus.tabs` items draw their icon in the native tab bar: an SF Symbol on iOS (`sfSymbol`, or the symbol mapped from the Lucide or semantic icon name), the Lucide icon elsewhere, the selected tab in the theme's primary colour. `role: search` makes an item iOS 26's search tab.
- The engine's `getContext` takes an `instanceId` and the screen's own `globals`.
