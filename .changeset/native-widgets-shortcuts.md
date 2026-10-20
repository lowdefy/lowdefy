---
'@lowdefy/shell': minor
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/api': minor
---

feat(mobile): Widgets, quick actions, App Shortcuts and background fetch

`mobile.widgets` lists widget sources (`{ id, title, layout: count | list, endpointId, path }`) for shells with the `widgets` extension: iOS Home Screen and Lock Screen widgets in two fixed layouts, the source picked when the widget is added, refreshed from the endpoints at launch, on resume, on a push with `data.refreshWidgets`, on background fetch and on `RefreshWidgets`. `mobile.shortcuts` (up to 4) become the app icon's quick actions on iOS and Android and the options of one App Shortcuts intent ("Open <shortcut> in <app>") for Siri and Spotlight; choosing one opens its path and fires `onShortcut`. `mobile.background: { endpointId, interval }` runs background fetch while the app is closed: the endpoint's `{ badge, refreshWidgets }` is applied, the offline queue is sent and the cached pages refresh. The build checks every endpoint and page these name.
