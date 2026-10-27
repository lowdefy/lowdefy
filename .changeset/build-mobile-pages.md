---
'@lowdefy/build': minor
'@lowdefy/blocks-native': minor
---

feat: `mobile:` key in lowdefy.yaml, with per-target block types for mobile pages

The build understands a new `mobile:` key, the pages, menus and home page a native Lowdefy shell shows:

```yaml
mobile:
  homePageId: today
  minShellVersion: 7.4.0
  menus:
    tabs:
      - { pageId: today, icon: House, title: Today }
      - { pageId: jobs, icon: ClipboardList, title: Jobs }
  pages:
    - _ref: mobile/today.yaml
    - _ref: mobile/jobs.yaml
```

- `menus` takes exactly one of `tabs` (2 to 5 items), `drawer` or `stack: true`. Items are `{ pageId, icon, title }` and must open a mobile page.
- `shells` lists the shells that open the app (`id`, `scheme`, `ios: { bundleId, teamId }`, `android: { package, sha256 }`), and `auth` is reserved for shell sign-in. An unknown key under `mobile:` fails the build.
- Pages share one id namespace across web and mobile. A page listed in both `pages` and `mobile.pages` (for example the same `_ref`) is shared and built once; with a different config under the same id the build fails.
- Mobile pages resolve their blocks, actions and client operators against the native block set, `@lowdefy/blocks-native`, and the `actions-core` actions. A mobile or shared page that uses a type with no native version fails the build, naming the page, block and type; `AgGrid` blocks and `Table` suggest `List` with `ListItem`. Requests, connections and server operators work on mobile pages as on web pages.
- `_js` on a mobile page builds into the page's own `_jsEntries`, since a shell cannot load the web client's `_js` module.
- The build writes `mobile/config.json` (home page, minimum shell version, menus with their icon data, shells), `mobile/pageIndex.json` (each mobile page's path, id, content hash and type set key) and `mobile/typeSets.json` (each type set's types with their plugin package and major version). An app without a `mobile:` key gets `{}` and `[]`. Mobile pages over 1 MB of JSON in total give a warning.
- Every built page now carries `target`: `web`, `mobile` or `both`.

`@lowdefy/blocks-native` is new: the native block set's types, metas and React Native components.
