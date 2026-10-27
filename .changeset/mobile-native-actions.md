---
'@lowdefy/shell': minor
'@lowdefy/client-native': minor
'@lowdefy/actions-core': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat(shell): Native actions, `_js`, i18n and icons in the phone shell

Phone pages now run the same actions and operators as the web. `SetFocus`, `ScrollTo`, `CopyToClipboard` and the local storage actions have native bodies under the same names: focus goes to the control a block registers, `ScrollTo` scrolls the page to a block's measured place, the clipboard is the phone's, and local storage values live in the device store under the app's keys. `SetDarkMode` and `SetLocale` work as on the web. The shell registers the client operators of every default operator package (`_dayjs`, `_nunjucks`, `_mql`, `_jsonata`, `_uuid` and the rest).

`_js` on mobile pages and in app events runs on the phone: the build gives the app events' client `_js` to the mobile root as module text, as it does for mobile pages. The mobile root also carries the app's `i18n`, and the shell picks the locale as the web does, with dayjs locale data for every locale. Menu icons are drawn from the root's icon data with client-native's new `Icon`, which draws the web's icon data with `react-native-svg`. The shell now passes the root's `theme` and `classMap` to client-native, so classes and the theme mode style blocks on the phone.
